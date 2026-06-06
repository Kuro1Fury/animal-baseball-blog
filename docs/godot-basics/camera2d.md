# Camera2D 与视口

> Camera2D 控制"玩家看到世界的哪个部分"，是做卷轴游戏的基础。

## 什么是 Camera2D

在 Godot 里，游戏世界可以比屏幕大得多。`Camera2D` 决定屏幕显示世界的哪个区域。

```
游戏世界（很大）
┌────────────────────────────────────┐
│                                    │
│      ┌──────────┐                  │
│      │ 屏幕显示 │ ← Camera2D 的视口│
│      │（可视范围│                  │
│      └──────────┘                  │
│              玩家●                 │
└────────────────────────────────────┘
```

**对 Java 开发者的类比**：Camera2D 类似数据库的分页查询——世界是完整数据，Camera 决定当前"页面"（可视窗口）是哪一段。

## 基本用法

### 把 Camera2D 挂在玩家身上（最常见）

```
Player（CharacterBody2D）
└── Camera2D    ← 跟随玩家移动
```

```gdscript
# 不需要任何代码，Camera2D 作为玩家子节点会自动跟随
# 玩家移动，Camera 也移动，世界随之滚动
```

### 设置平滑跟随

```gdscript
# Camera2D 属性
$Camera2D.position_smoothing_enabled = true
$Camera2D.position_smoothing_speed   = 5.0   # 越大跟得越紧
```

开启平滑后，Camera 会"追赶"目标位置，产生惯性效果。

### 限制 Camera 范围

```gdscript
# 不让 Camera 超出地图边界
$Camera2D.limit_left   = 0
$Camera2D.limit_top    = 0
$Camera2D.limit_right  = 3000   # 地图宽度
$Camera2D.limit_bottom = 1000   # 地图高度
```

## Animal Baseball 里为什么没有 Camera2D？

项目的场景大小（1280×750）和屏幕分辨率完全一样，整个球场就是整个可视区域，不需要滚动。所以没有 Camera2D 节点。

这是完全合理的——固定屏幕的游戏（棋盘、Pong、固定场景的对战游戏）不需要 Camera。

## 什么时候需要 Camera2D？

- **平台跳跃游戏**：角色跑出屏幕边缘时，画面跟着滚动
- **开放世界 / 大地图**：地图比屏幕大，需要滚动
- **俯视角 RPG**：角色在地图上移动，画面跟随
- **需要缩放（zoom）的场景**：战略游戏的缩放视图

Animal Baseball 后续如果扩展到更大的球场，或者增加球飞出屏幕后的追踪视角，就会需要 Camera2D。

## 缩放（Zoom）

```gdscript
$Camera2D.zoom = Vector2(2.0, 2.0)  # 放大 2 倍（物体看起来更大，可视范围缩小）
$Camera2D.zoom = Vector2(0.5, 0.5)  # 缩小 0.5 倍（物体更小，可视范围扩大）
```

注意 zoom 的直觉是**反的**：zoom 值越大，物体显示越大，但看到的世界范围越小。

## 屏幕坐标与世界坐标的转换

有了 Camera 后，屏幕上的坐标和世界坐标不再相同：

```gdscript
# 鼠标位置（屏幕坐标）→ 世界坐标
var world_pos := get_global_mouse_position()

# 世界坐标 → 屏幕坐标
var screen_pos := get_viewport().get_camera_2d().unproject_position(world_pos)
```

Animal Baseball 里不需要这个转换（因为没有 Camera，屏幕坐标 == 世界坐标）。

## Viewport 基础

`Viewport` 是 Godot 里"渲染目标"的概念，所有 Camera2D 都属于某个 Viewport。

```gdscript
get_viewport()            # 获取当前节点所在的 Viewport
get_viewport().size       # 屏幕/视口的像素尺寸（Vector2）
get_viewport().get_camera_2d()  # 获取当前 Camera2D
```

在 Animal Baseball 里经常用到 `get_viewport().size` 来计算屏幕中心：

```gdscript
var center := get_viewport().size / 2  # Vector2(640, 375) 如果是 1280×750
```

## 拉伸与适配（Stretch）

Godot 项目设置里有 `Display → Window → Stretch`，控制当窗口大小变化时如何处理：

| 模式 | 效果 |
|------|------|
| `disabled` | 不拉伸，保持原始像素 |
| `canvas_items` | 内容拉伸，保持宽高比（推荐 2D 游戏）|
| `viewport` | 视口拉伸，像素化效果（像素艺术游戏）|

这个设置影响 Camera2D 的行为，在 1080p 屏幕上运行 1280×750 的游戏时是否拉伸，取决于这个配置。
