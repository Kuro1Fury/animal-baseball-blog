# 动态节点创建：new()、add_child()、queue_free()

> Godot 允许在运行时用代码创建、添加和销毁节点，类似 Java 里的 `new` + 容器注册。

## 三个核心操作

```gdscript
# 1. 创建节点实例
var node := AudioStreamPlayer.new()   # 等同于 Java: new AudioStreamPlayer()

# 2. 加入场景树（必须，否则节点不工作）
add_child(node)                        # 加为当前节点的子节点
get_parent().add_child(node)           # 加为父节点的子节点

# 3. 销毁节点
node.queue_free()                      # 安全销毁（在当前帧结束后执行）
```

## 为什么需要 add_child？

Godot 里，**节点必须在场景树里才能工作**：
- `_ready()` 不会被调用
- `_process()` 不会被调用
- 信号不会触发
- 物理不参与

`new()` 只是创建了一个对象，`add_child()` 才是把它"激活"接入游戏世界。

**对 Java 开发者的类比**：类似 Spring 里 `new MyBean()` 和 `applicationContext.registerBean()` 的区别——前者只是 Java 对象，后者才纳入容器管理。

## 项目里的动态创建示例

### 音频播放器（game_director.gd）

```gdscript
func _init_sfx() -> void:
    var names := ["swing", "hit", "catch", "miss", "out", "hit_result"]
    for key in names:
        for ext in ["ogg", "wav"]:
            var candidate := "res://assets/audio/sfx/sfx_%s.%s" % [key, ext]
            if ResourceLoader.exists(candidate):
                var player := AudioStreamPlayer.new()   # 创建
                player.stream = load(candidate)          # 配置
                add_child(player)                        # 激活
                _sfx[key] = player                       # 存引用
                break
```

这是动态创建节点的典型模式：**创建 → 配置 → 加入场景树 → 保存引用**。

### 调试可视化（game_director.gd）

V 键或 F4 键切换击球时机区域显示：

```gdscript
func _add_zone_band(cx: float, y1: float, hw: float, y2: float, color: Color) -> void:
    var p := Polygon2D.new()
    p.color   = color
    p.z_index = 10
    p.polygon = PackedVector2Array([
        Vector2(cx - hw, y1), Vector2(cx + hw, y1),
        Vector2(cx + hw, y2), Vector2(cx - hw, y2),
    ])
    get_parent().add_child(p)   # 加到父节点（场景根）
    _zone_nodes.append(p)       # 记录以便清除
```

关闭时批量销毁：

```gdscript
func _clear_zone_overlay() -> void:
    for n in _zone_nodes:
        n.queue_free()    # 安全销毁
    _zone_nodes.clear()  # 清空引用列表
```

## queue_free() vs free()

| 方法 | 执行时机 | 使用场景 |
|------|----------|---------|
| `queue_free()` | 当前帧处理结束后 | **推荐**，安全，避免在信号/物理回调中途删除节点 |
| `free()` | 立即 | 确定没有任何代码还在引用这个节点时才用 |

绝大多数情况用 `queue_free()`。`free()` 如果在节点仍被引用时调用，会导致"使用已释放对象"的崩溃错误。

**对 Java 开发者的类比**：`free()` 就像手动释放内存（C 语言风格），`queue_free()` 像 Java GC 标记——标记后 GC 在合适时机回收。

## 节点名和查找

动态创建的节点可以设置名字，方便后续查找：

```gdscript
var p := Polygon2D.new()
p.name = "HitZoneBand"   # 设置名字
add_child(p)

# 之后可以用名字查找
var band = get_node_or_null("HitZoneBand")
```

`get_node_or_null()` 是安全版本，找不到返回 null 而不是报错（对应 `$` 找不到会报错）。

## PackedScene：从场景文件实例化

除了手动 `new()` 创建基础节点，还可以把整个场景（`.tscn`）实例化出来：

```gdscript
# 加载场景资源
var bullet_scene: PackedScene = preload("res://scenes/Bullet.tscn")

# 实例化（每次产生一个独立副本）
var bullet := bullet_scene.instantiate()
bullet.position = player.position
add_child(bullet)
```

`preload()` 在脚本加载时就把资源载入内存（编译时），`load()` 是运行时按需加载。

Animal Baseball 里没有用 PackedScene 实例化（因为所有动物都是在场景编辑器里预先放好的），但这是 Godot 里"动态生成敌人/子弹"的标准做法。

## 动态节点 vs 预置节点

| | 预置节点（场景里放好）| 动态创建 |
|-|----------------------|---------|
| 优点 | 简单直观，Inspector 可见 | 按需创建，数量可变 |
| 缺点 | 数量固定，不适合可变数量 | 代码更复杂，需要管理引用 |
| 适合 | 守备员、投手（数量固定）| 音效播放器、调试可视化、子弹 |

项目里：
- 守备员、Runner、UI Label → 预置节点（场景里预先放好）
- AudioStreamPlayer、调试 Polygon2D/Line2D/Label → 动态创建

## 一个实际踩过的坑

commit `c7b233e` 的说明：

> "将动态创建的 Line2D ring 改为场景静态节点，修复圆圈不显示问题"

原因：动态创建的 Line2D 在某些情况下不显示（可能与 z_index、渲染顺序、初始化时序有关）。改为预置节点 + 运行时更新 `points` 属性后问题消失。

**经验**：如果某个节点在生命周期内始终存在（只是数据变化），用预置节点更稳定。只有需要动态增删时才用 `new()`。

## 在项目里找这些内容

- `game_director.gd`:121-136 — `_init_sfx()`（动态创建 AudioStreamPlayer）
- `game_director.gd`:553-584 — `_add_zone_band()`、`_add_zone_line()`（动态创建可视化节点）
- `game_director.gd`:598-601 — `_clear_zone_overlay()`（批量 queue_free）
