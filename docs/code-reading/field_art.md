# field_art.gd — 程序化场地绘制

**文件路径**：`scripts/field/field_art.gd`（90 行）

## 这个文件做什么

FieldArt 在 `_ready()` 时用纯代码绘制整个棒球场：内野泥地、投手丘、界外线、外野边界、四个垒包。

**没有任何手动放置的 Sprite 或图片资源**，完全用 `Polygon2D` 和 `Line2D` 节点组合而成。

## 为什么要程序化生成？

- 场地坐标和游戏逻辑中的 Marker2D 坐标必须完全对齐
- 代码生成可以保证一致性，改一个常量就能同步调整
- 不依赖外部美术资源，随时可以调整形状

## `_ready()` 的执行顺序

```gdscript
func _ready() -> void:
    for child in get_children():
        child.queue_free()    # 先清除编辑器里可能残留的子节点
    _make_infield_dirt()      # 内野泥地（多边形）
    _make_pitchers_mound()    # 投手丘（圆形）
    _make_foul_lines()        # 界外线（两条直线）
    _make_outfield_boundary() # 外野边界（折线）
    _make_base_markers()      # 四个垒包（菱形）
```

## 坐标系

所有坐标都以**屏幕像素**为单位（1280×750 的场景）：

```gdscript
const HOME_POS    := Vector2(640, 620)  # 本垒（中下）
const PITCHER_POS := Vector2(640, 430)  # 投手板（中间偏下）
const FIRST_POS   := Vector2(850, 470)  # 一垒（右侧）
const SECOND_POS  := Vector2(640, 310)  # 二垒（中上）
const THIRD_POS   := Vector2(430, 470)  # 三垒（左侧）
```

这些常量和场景里的 `Marker2D` 节点位置一致（注释明确说明 `# matches HomeBase Marker2D`）。

## 三种图形原语

### `_poly(node_name, color)` → Polygon2D

创建一个 `Polygon2D` 节点，设置颜色，加入场景：

```gdscript
func _poly(node_name: String, color: Color) -> Polygon2D:
    var p := Polygon2D.new()
    p.name = node_name
    p.color = color
    add_child(p)
    return p
```

### `_line(node_name, pts, color, width)` → Line2D

创建一个 `Line2D` 节点：

```gdscript
func _line(node_name: String, pts: Array, color: Color, width: float) -> Line2D:
    var l := Line2D.new()
    l.name = node_name
    l.default_color = color
    l.width = width
    for pt in pts:
        l.add_point(pt)
    add_child(l)
    return l
```

### `_circle(center, radius, segs)` → PackedVector2Array

生成近似圆形的多边形顶点数组：

```gdscript
func _circle(center: Vector2, radius: float, segs: int) -> PackedVector2Array:
    var pts := PackedVector2Array()
    for i in segs:
        var a := TAU * i / segs
        pts.append(center + Vector2(cos(a), sin(a)) * radius)
    return pts
```

`TAU = 2π`，这是 Godot 内置常量。将 360° 均分 `segs` 份，每份计算一个顶点。`segs=16` 时已经很接近圆形了。

## 垒包的菱形算法

```gdscript
func _base(node_name: String, pos: Vector2, s: float) -> void:
    var p := _poly(node_name, C_MARKINGS)
    p.polygon = PackedVector2Array([
        pos + Vector2(0, -s),   # 上顶点
        pos + Vector2(s, 0),    # 右顶点
        pos + Vector2(0,  s),   # 下顶点
        pos + Vector2(-s, 0),   # 左顶点
    ])
```

`s = BASE_HALF = 12.0`，菱形四个顶点分别在上右下左方向 12px 处。

## 这个文件和游戏逻辑的关系

FieldArt 是纯"展示层"，不参与任何物理判定。真正的垒位判定依赖场景里的 `Marker2D` 节点（`_first_base_point` 等）。

视觉垒包位置和逻辑垒包位置**必须手动保持同步**——这是注释 `# Positions must match TrainingField marker nodes` 存在的原因。

## 读完后你应该能回答

1. 为什么 `_ready()` 开头要先 `queue_free()` 所有子节点？
2. `_circle()` 函数用了什么数学方法生成圆形顶点？如果把 `segs` 改成 4 会生成什么形状？
3. 如果要把场地缩小到 0.8 倍，需要改哪些地方（至少两处）？
4. `FieldArt` 的坐标和 `GameDirector` 的 `force_base_touch_radius` 有什么关系？

## 涉及文件

- `scripts/field/field_art.gd` — 全部（90 行）
- `scripts/gameplay/game_director.gd` — `_first_base_point`、`force_base_touch_radius`（逻辑层的垒位）
