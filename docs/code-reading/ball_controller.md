# ball_controller.gd — 球物理系统

**文件路径**：`scripts/ball/ball_controller.gd`（159 行）

## 这个文件做什么

BallController 是整个游戏物理的核心。它管理球在任何时刻的状态，并负责所有视觉表现。

**设计原则**：逻辑与视觉分离。`plane_pos`（地面坐标）和 `height_z`（高度）是逻辑数据，`_update_visuals()` 负责把逻辑数据翻译成屏幕上看到的东西。

## 先看这里：状态机

```gdscript
enum BallState { IDLE, PITCHING, HIT_FLYING, GROUND_ROLLING, CAUGHT, THROWING, DEAD }
```

球在任何时刻只处于一种状态。`_physics_process` 根据状态分派到对应的 `_tick_*` 函数：

```gdscript
func _physics_process(delta: float) -> void:
    match state:
        BallState.PITCHING:       _tick_pitching(delta)
        BallState.HIT_FLYING:     _tick_hit_flying(delta)
        BallState.GROUND_ROLLING: _tick_ground_rolling(delta)
        BallState.THROWING:       _tick_throwing(delta)
```

状态转换图：

```
IDLE ──(start_pitch)──→ PITCHING ──(球过主场)──→ DEAD
                                    ↓(被击中)
                              HIT_FLYING ──(落地)──→ GROUND_ROLLING ──→ DEAD
                                    ↓(接住)
                              CAUGHT ──(start_throw)──→ THROWING ──→ DEAD
```

## 重要变量：优先阅读

| 变量 | 类型 | 含义 |
|------|------|------|
| `state` | `BallState` | 当前状态 |
| `plane_pos` | `Vector2` | 地面上的 XY 位置（逻辑坐标）|
| `height_z` | `float` | 距地面高度（逻辑单位，非像素）|
| `hit_velocity` | `Vector2` | 被击球后的水平速度 |
| `vertical_velocity` | `float` | 垂直方向速度（正=上升，负=下落）|
| `pitch_elapsed` | `float` | 投球已过去的时间（给 BattingController 用）|

## 视觉层：`_update_visuals()`

```gdscript
func _update_visuals() -> void:
    position = plane_pos                          # 节点位置 = 地面投影
    $BallSprite.position.y = -height_z * Z_VISUAL_SCALE  # 球精灵向上偏移
    var shadow_scale := maxf(0.3, 1.0 - height_z / 200.0)
    $Shadow.scale      = Vector2(shadow_scale, shadow_scale * 0.5)
    $Shadow.modulate.a = shadow_scale * 0.8       # 越高越淡
```

关键点：
- **节点本身**停在地面投影位置
- **球精灵**在节点内部向上偏移（产生"球在空中"的视觉效果）
- **阴影**随高度缩小、变淡（提供高度感知）

这是 2D 模拟高度的经典技巧，详见 [z 高度模拟](/godot-notes/z-height-simulation)。

## 关键函数速查

| 函数 | 调用者 | 作用 |
|------|--------|------|
| `start_pitch(from, to)` | GameDirector | 开始投球 |
| `start_hit(direction, speed, vz)` | GameDirector | 被击出 |
| `start_throw(from, to, speed)` | GameDirector | 开始传球 |
| `catch()` | GameDirector | 接住球，停止所有运动 |
| `reset(pos)` | GameDirector | 重置到初始状态 |
| `_tick_pitching(delta)` | 内部 | 投球物理每帧更新 |
| `_tick_hit_flying(delta)` | 内部 | 飞球物理（重力）|
| `_tick_ground_rolling(delta)` | 内部 | 地滚球物理（摩擦）|
| `_tick_throwing(delta)` | 内部 | 传球运动 |
| `_update_visuals()` | 全部 `_tick_*` | 同步视觉 |

## `@export` 参数一览

这些参数都可以在 Godot Inspector 里实时调整：

```gdscript
@export var pitch_duration:  float = 1.5    # 投球时长
@export var pitch_peak_z:    float = 100.0  # 弧顶高度
@export var pitch_arrive_z:  float = 60.0   # 过本垒高度
@export var ground_friction: float = 150.0  # 地滚球减速率
@export var min_ground_speed: float = 30.0  # 地滚球最低速度（低于此值停止）
```

## 读完后你应该能回答

1. 球被击出后，`vertical_velocity` 的初始值从哪里来？（提示：看 `start_hit` 和 `batting_controller.gd`）
2. `GROUND_BALL_HEIGHT_THRESHOLD = 3.0` 意味着什么？球高度降到多少会切换状态？
3. 传球（THROWING）和飞球（HIT_FLYING）的物理有什么区别？传球为什么不受重力？
4. 球出界（`_is_out_of_bounds()`）时，为什么 PITCHING 和 HIT_FLYING 的处理方式不同？
