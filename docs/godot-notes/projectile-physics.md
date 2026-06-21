# 手动斜抛物理 — 不用 RigidBody2D 的理由和实现

> 对应项目代码：`scripts/ball/ball_controller.gd` → `_tick_throwing()`

## 两种思路的对比

Godot 提供 `RigidBody2D` 节点，可以自动处理重力、碰撞、弹跳——直觉上应该用它。但 `ball_controller.gd` 完全没有用 `RigidBody2D`，而是用 `Node2D` + 手写积分。为什么？

| | RigidBody2D | 手写积分（项目选择）|
|---|---|---|
| 物理空间 | 真实 2D 物理平面 | 自定义：`plane_pos`（平面）+ `height_z`（高度）|
| 重力方向 | 向下（屏幕 y+）| 向下（`height_z` 减少）|
| 碰撞 | 自动（碰撞层/掩码）| 手动判断 `height_z <= threshold` |
| 控制精度 | 受物理引擎约束 | 完全可控（每个参数都是 @export）|
| "高度"概念 | 需要 hack（假 3D）| 原生支持（`height_z` 变量）|

项目使用 **"伪 3D"坐标系**：球的屏幕位置（`plane_pos`）代表地面投影，`height_z` 代表离地高度，`_update_visuals()` 根据这两个值计算真正的屏幕坐标和阴影大小。在这个坐标系里，RigidBody2D 的 2D 重力完全不适用——球的"重力"要作用在 `height_z` 上，而不是屏幕 y 轴。

## 手动积分的原理

物理学的欧拉积分：

```
位置 += 速度 × Δt
速度 += 加速度 × Δt
```

项目的 `_tick_throwing()` 就是这个：

```gdscript
func _tick_throwing(delta: float) -> void:
    # 水平：匀速（无摩擦，速度不变）
    plane_pos += _throw_velocity * delta

    # 竖直：重力加速（GRAVITY = 200.0 z/s²）
    vertical_velocity -= GRAVITY * delta
    height_z          += vertical_velocity * delta
```

`delta` 是上一帧到这一帧的时间间隔（由 `_physics_process(delta)` 传入）。这里的 `GRAVITY` 不是现实重力，是调参出来的游戏感觉对的数值。

## 落地和弹跳

```gdscript
    if height_z <= GROUND_BALL_HEIGHT_THRESHOLD and vertical_velocity < 0.0:
        height_z = 0.0
        if _bounce_count < throw_max_bounces \
                and abs(vertical_velocity) >= throw_bounce_min_vz:
            # 弹跳：竖直速度反向衰减，水平速度也衰减
            _bounce_count    += 1
            vertical_velocity = -vertical_velocity * throw_bounce_vz_damping  # 0.50
            _throw_velocity  *= throw_bounce_h_damping                         # 0.80
        else:
            # 弹跳次数用完或速度太低 → 转地滚
            hit_velocity      = _throw_velocity
            state             = BallState.GROUND_ROLLING
            throw_landed.emit()
```

条件 `vertical_velocity < 0.0` 防止球从地面往上冒出时误判落地（速度向上时不处理）。

## 出手初速度怎么选？

峰值高度的计算：

```
h = v0² / (2 × g)
= 130² / (2 × 200)
= 16900 / 400
≈ 42 px
```

调参时只需要改 `throw_start_vz`，峰值高度就变了，不需要改任何其他逻辑。

## 和 `_physics_process` 的关系

手动积分必须放在 `_physics_process` 里（不能放 `_process`），原因：

- `_physics_process` 的 `delta` 是**固定步长**（默认 1/60 秒，可配置），不受帧率波动影响
- 物理计算（位置积分）在固定步长下结果稳定；如果放 `_process`，帧率抖动会导致球的落点随机漂移

参见 [_process 与 _physics_process](/godot-notes/process-and-physics)。

## Java 类比

手动积分对后端工程师来说并不陌生——它和游戏循环驱动的状态更新本质上是一样的：

```java
// 类比：每次"tick"推进状态
class BallSimulation {
    double heightZ;
    double verticalVelocity;
    static final double GRAVITY = 200.0;

    void tick(double deltaSeconds) {
        verticalVelocity -= GRAVITY * deltaSeconds;
        heightZ          += verticalVelocity * deltaSeconds;
    }
}
```

区别只是 Java 版通常在 Scheduler/循环里调用，Godot 版由引擎在每个物理帧调用 `_physics_process`。

## 什么时候该用 RigidBody2D？

- 需要**真实碰撞**（多个物体互相弹开、堆叠）
- 物理行为复杂到手写代价太高
- 不需要自定义坐标系

这个项目选择手写的理由：伪 3D 高度系统 + 完全可控的调参需求，比用 RigidBody2D hack 出来的方案更简洁。
