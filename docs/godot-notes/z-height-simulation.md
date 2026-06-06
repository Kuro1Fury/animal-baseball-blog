# 用 z 变量模拟 2D 游戏中的高度

> 这是整个 Animal Baseball 物理系统的核心思想。

## 问题

Godot 2D 的世界是平的：节点只有 `position.x` 和 `position.y`，没有 z 轴（z_index 是渲染层级，不是物理高度）。

但棒球必须有高度：飞球和地滚球的区别完全取决于球离地多高。

## 解决方案：逻辑 z + 视觉偏移

项目引入一个**纯逻辑变量** `height_z`，不是 Godot 的坐标系统的一部分，只是一个普通 float：

```gdscript
# ball_controller.gd
var plane_pos  := Vector2.ZERO  # 地面坐标（物理判定用这个）
var height_z   := 0.0           # 逻辑高度（不是像素，是游戏单位）
```

然后在 `_update_visuals()` 里把逻辑高度翻译成屏幕上看到的效果：

```gdscript
func _update_visuals() -> void:
    position = plane_pos                               # 节点停在地面投影
    $BallSprite.position.y = -height_z * Z_VISUAL_SCALE  # 精灵向上偏移
    var shadow_scale := maxf(0.3, 1.0 - height_z / 200.0)
    $Shadow.scale      = Vector2(shadow_scale, shadow_scale * 0.5)
    $Shadow.modulate.a = shadow_scale * 0.8
```

## 为什么精灵要向**上**偏移（负 y）？

Godot 2D 坐标系：y 轴**向下**为正方向。

- 球在地面（`height_z = 0`）→ 精灵 y 偏移 = 0（停在地上）
- 球在空中（`height_z = 80`）→ 精灵 y 偏移 = -80（屏幕上方，看起来像飞起来了）

```
屏幕顶部（y = 0）
       ↑
    [球精灵]   ← position.y = plane_pos.y - height_z
       
    [阴影]     ← position.y = plane_pos.y（固定在地面）
       ↓
屏幕底部（y = 750）
```

## 阴影的作用

阴影固定在地面位置（`plane_pos`），不随 `height_z` 移动。

随着球升高：
- 阴影缩小（`shadow_scale` 减小）
- 阴影变淡（`modulate.a` 减小）

这给玩家提供了两个高度线索：球精灵的位置 + 阴影的大小。

## 重力实现

`height_z` 受到"重力"影响：

```gdscript
# ball_controller.gd:108-110
func _tick_hit_flying(delta: float) -> void:
    plane_pos         += hit_velocity * delta
    vertical_velocity -= GRAVITY * delta      # 垂直速度每帧减少（重力加速度）
    height_z           = maxf(0.0, height_z + vertical_velocity * delta)
```

`GRAVITY = 200.0`（单位：游戏单位/秒²）。这是自定义重力，和 Godot 物理引擎的 `gravity_scale` 没有关系。

`maxf(0.0, ...)` 确保 `height_z` 不会变成负数（球不会穿地）。

## 接球判定：椭圆方程用 z 轴

```gdscript
# fielding_judge.gd
return (dist * dist) / (h * h) + (ball_z * ball_z) / (v * v) <= 1.0
```

- `dist` = 地面距离（`plane_pos` 层面的 XY 距离）
- `ball_z` = 球的高度（`height_z`）

**物理判定完全基于 `plane_pos` 和 `height_z`，不受精灵偏移影响**。这是逻辑与视觉分离的关键好处。

## 传球的简化处理

传球（THROWING）不计算重力，高度固定为 20：

```gdscript
# ball_controller.gd:68
height_z = 20.0  # fixed height — throw visually off the ground
```

这是一个有意的简化：传球在视觉上保持离地，但不需要完整的抛物线物理。

## 小结

| 层面 | 变量 | 用途 |
|------|------|------|
| 物理层 | `plane_pos`、`height_z` | 碰撞、接球判定、传球计算 |
| 视觉层 | `$BallSprite.position.y`、`$Shadow.scale` | 屏幕上看到的效果 |

两者通过 `_update_visuals()` 桥接，逻辑不依赖视觉，视觉完全由逻辑派生。

## 在项目里找这些内容

- `ball_controller.gd`:153-158 — `_update_visuals()` 完整实现
- `ball_controller.gd`:107-119 — 飞球重力计算
- `fielding_judge.gd`:15-22 — 椭圆接球判定
