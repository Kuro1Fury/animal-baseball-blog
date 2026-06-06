# _process 与 _physics_process

## 两个更新函数的区别

| | `_process(delta)` | `_physics_process(delta)` |
|-|-------------------|--------------------------|
| 调用时机 | 每帧（渲染帧率，如 60fps）| 固定频率（默认 60Hz，与帧率解耦）|
| 适合做什么 | UI 更新、输入检测、视觉效果 | 物理运动、`move_and_slide()` |
| `delta` 含义 | 上一帧到这一帧的时间 | 固定的物理步长（约 1/60 秒）|

## 项目里的分工

### `_process` 的使用

**GameDirector**（`game_director.gd`:154）用 `_process`：

```gdscript
func _process(delta: float) -> void:
    _update_runner_visuals()   # UI / 视觉
    _update_hud_label()        # UI 标签
    _update_debug_label()      # Debug 标签
    # 传球目标追踪（每帧更新传球线）
    if _throw_in_progress and _throw_target_fielder != null:
        ball.update_throw_target(...)
    # 游戏逻辑（踩垒检测、计时器）
```

### `_physics_process` 的使用

**BallController**（`ball_controller.gd`:86）用 `_physics_process`：

```gdscript
func _physics_process(delta: float) -> void:
    match state:
        BallState.PITCHING:       _tick_pitching(delta)
        BallState.HIT_FLYING:     _tick_hit_flying(delta)
        BallState.GROUND_ROLLING: _tick_ground_rolling(delta)
        BallState.THROWING:       _tick_throwing(delta)
```

球的位置每帧都在变化，使用 `_physics_process` 确保物理更新在稳定的时间步长里进行。

**AnimalController**（`animal_controller.gd`:59）用 `_physics_process`：

```gdscript
func _physics_process(_delta: float) -> void:
    if not controlled: return
    var dir := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = dir * move_speed
    move_and_slide()   # 必须在 _physics_process 里调用
```

`move_and_slide()` 是 CharacterBody2D 的物理移动方法，**必须在 `_physics_process` 里调用**，否则会收到警告或行为不正确。

**RunnerController**（`runner_controller.gd`:38）也用 `_physics_process`：

```gdscript
func _physics_process(_delta: float) -> void:
    if state != State.RUNNING_TO_FIRST: return
    ...
    batter_runner.move_and_slide()
```

## 为什么 GameDirector 用 `_process` 而不是 `_physics_process`？

GameDirector 主要做：
1. UI 更新（不需要物理精度）
2. 游戏状态判断（逻辑判断，不是物理计算）
3. 输入检测（`Input.is_action_just_pressed` 在两种函数里都能用）

实际上，GameDirector 在 `_process` 里也做了踩垒距离检测（`distance_to`），这不是严格意义上的"物理"，只是几何计算，用 `_process` 完全没问题。

## `_physics_process` 里不传 `delta` 的情况

RunnerController 的参数用了下划线前缀：

```gdscript
func _physics_process(_delta: float) -> void:
```

`_delta` 表示"我知道有这个参数，但我不用它"。GDScript 里用下划线前缀表示有意忽略的参数，避免编译器警告。

AnimalController 的移动没有乘以 `delta`：

```gdscript
velocity = dir * move_speed   # 注意：没有 * delta
move_and_slide()
```

这是因为 CharacterBody2D 的 `velocity` 属性本身就是"每秒的速度"，`move_and_slide()` 内部会自动处理 delta 时间步长。

## 在项目里找这些内容

- `ball_controller.gd`:86-91 — BallController 的 `_physics_process`
- `animal_controller.gd`:59-71 — AnimalController 的 `_physics_process`
- `runner_controller.gd`:38-48 — RunnerController 的 `_physics_process`
- `game_director.gd`:154-175 — GameDirector 的 `_process`
