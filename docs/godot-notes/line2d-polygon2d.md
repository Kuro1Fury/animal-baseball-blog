# Line2D / Polygon2D 程序化绘图

## 两种节点的用途

| 节点 | 用途 |
|------|------|
| `Polygon2D` | 实心多边形（内野泥地、垒包、接球范围圆圈）|
| `Line2D` | 折线 / 圆圈（界外线、外野边界、调试圆圈、传球线）|

## 项目里的使用场景

### FieldArt（场地美术）

完全用代码生成：

```gdscript
# field_art.gd
func _make_infield_dirt() -> void:
    var p := _poly("InfieldDirt", C_DIRT)   # 创建 Polygon2D
    p.polygon = PackedVector2Array([         # 设置顶点数组
        Vector2(640, 660), Vector2(740, 595), ...
    ])

func _make_foul_lines() -> void:
    _line("FoulLineLeft", [HOME_POS, Vector2(0, 163)], C_MARKINGS, 2.0)  # 创建 Line2D
```

### AnimalController（接球范围圆圈）

```gdscript
# animal_controller.gd:21-26
var circle := PackedVector2Array()
for i in 24:
    var angle := TAU * i / 24.0
    circle.append(Vector2(cos(angle), sin(angle)) * p["catch_h_radius"])
$CatchRange.polygon = circle   # 直接赋值给 Polygon2D.polygon
```

24 个顶点构成接近圆形的多边形（`CatchRange` 是场景里预置的 Polygon2D 节点）。

### GameDirector（调试可视化）

运行时动态创建 `Polygon2D` 和 `Line2D`：

```gdscript
# game_director.gd:553-563（击球时机区域可视化）
func _add_zone_band(cx: float, y1: float, hw: float, y2: float, color: Color) -> void:
    var p := Polygon2D.new()       # 动态创建
    p.color   = color
    p.z_index = 10                  # 渲染层级
    p.polygon = PackedVector2Array([
        Vector2(cx - hw, y1), Vector2(cx + hw, y1),
        Vector2(cx + hw, y2), Vector2(cx - hw, y2),
    ])
    get_parent().add_child(p)       # 加入场景
    _zone_nodes.append(p)           # 记录以便后续清除
```

清除时：
```gdscript
for n in _zone_nodes:
    n.queue_free()
_zone_nodes.clear()
```

### 跑者圆圈和传球线

场景里预置的 `Line2D` 节点，运行时更新顶点：

```gdscript
# game_director.gd（初始化跑者圆圈）
var rr_pts := PackedVector2Array()
for i in 25:
    var angle := TAU * i / 24.0
    rr_pts.append(Vector2(cos(angle), sin(angle)) * 28.0)
_runner_ring.points = rr_pts
```

注意：圆圈用 25 个点、循环 `i in 25`，最后一个点和第一个点相同，形成闭合环。

传球线只有两个端点，运行时更新：

```gdscript
_throw_line.points = PackedVector2Array([from, tgt_local])   # 设置端点
_throw_line.set_point_position(1, tgt_local)                  # 实时更新终点
```

## 一个曾经踩过的 bug

`c7b233e` 的 commit 记录了一个真实 bug：

> "将动态创建的 Line2D ring 改为场景静态节点，修复圆圈不显示问题"

最初跑者圆圈是在 `_ready()` 里用 `Line2D.new()` 动态创建的，但圆圈不显示。原因是动态创建的节点可能因为 z_index、父节点或时序问题导致不可见。

解决方案：改为在 Godot 编辑器里预先放置 `Line2D` 节点（场景静态节点），在代码里只更新它的 `points` 属性。这是更稳定的做法。

**经验**：可视化调试元素优先用预置场景节点 + 运行时更新，不要动态 `new()`。

## PackedVector2Array vs Array

```gdscript
PackedVector2Array([...])   # 推荐：内存连续，Godot 原生类型
Array[Vector2]([...])       # 通用数组，性能略差
```

`Polygon2D.polygon` 和 `Line2D.points` 都接受 `PackedVector2Array`，性能更好，也是 Godot 的推荐用法。

## z_index：渲染层级

```gdscript
p.z_index = 10   # 在其他节点上方渲染
l.z_index = 11   # 线在多边形上方
lbl.z_index = 12 # 标签最上层
```

`z_index` 越大，越后渲染（显示在最上面）。这和 CSS 的 `z-index` 概念相同。

## 在项目里找这些内容

- `field_art.gd` — 全部（场地美术的完整实现）
- `animal_controller.gd`:21-29 — 接球范围圆圈
- `game_director.gd`:100-119 — 跑者圆圈初始化
- `game_director.gd`:522-584 — 击球时机区域可视化（动态 Polygon2D + Line2D）
- Commit `c7b233e` — Line2D 静态节点修复记录
