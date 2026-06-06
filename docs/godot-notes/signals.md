# signal 信号系统

## 信号是什么

信号是 Godot 的事件通知机制：一个节点"发射"信号，其他节点"监听"并响应。

相比直接调用函数，信号的好处是**解耦**：发射方不需要知道谁在监听，监听方不需要知道事件何时发生。

## 项目里定义的信号

### BallController 的 4 个信号

```gdscript
# ball_controller.gd:4-7
signal ball_reached_home   # 球越过本垒（t=1.0）
signal pitch_ended         # 球离开屏幕，投球结束
signal ball_landed         # 球落地（飞球或地滚球停止）
signal throw_completed     # 传球到达目标
```

发射时机：
- `ball_reached_home` → `_tick_pitching()` 里 `t >= 1.0` 时
- `pitch_ended` → 球的 y 坐标超出屏幕（`plane_pos.y > 750.0`）
- `ball_landed` → 球出界或地滚速度降到 `min_ground_speed` 以下
- `throw_completed` → `_tick_throwing()` 里到达目标位置

### RunnerController 的 1 个信号

```gdscript
# runner_controller.gd:6
signal reached_first_base   # 击球者到达一垒
```

发射时机：`_physics_process` 里 `to_target.length() < arrive_threshold` 时。

### TrainingSetupPanel 的 1 个信号

```gdscript
# training_setup_panel.gd:3
signal setup_applied(strikes: int, outs: int, base_state: String)
```

这个信号带参数，发射时直接传递配置数据。

## 信号连接（在 GameDirector 的 `_ready()` 里）

```gdscript
# game_director.gd:74-78
ball.ball_reached_home.connect(_on_ball_reached_home)
ball.pitch_ended.connect(_on_pitch_ended)
ball.ball_landed.connect(_on_ball_landed)
_runner_controller.reached_first_base.connect(_on_reached_first_base)
ball.throw_completed.connect(_on_throw_completed)
```

GDScript 里连接信号的语法：`source.signal_name.connect(callback_function)`

## 信号流转图

```
[BallController]
  ball_reached_home  ──→  _on_ball_reached_home()   (pass，击球窗口还开着)
  pitch_ended        ──→  _on_pitch_ended()          (未挥棒 → 记 Strike)
  ball_landed        ──→  _on_ball_landed()           (判断 Safe / Hit)
  throw_completed    ──→  _on_throw_completed()       (判断 Force Out / Hold)

[RunnerController]
  reached_first_base ──→  _on_reached_first_base()   (判断 Safe)

[TrainingSetupPanel]
  setup_applied      ──→  _on_training_setup_applied() (应用训练配置)
```

## 带参数 vs 不带参数的信号

```gdscript
# 不带参数：只通知"事件发生了"
signal ball_landed

# 带参数：同时传递数据
signal setup_applied(strikes: int, outs: int, base_state: String)
```

带参数的信号在连接时，接收函数签名必须匹配：

```gdscript
func _on_training_setup_applied(strikes: int, outs: int, base_state: String) -> void:
    _apply_training_setup(strikes, outs, base_state)
```

## 为什么 `ball_reached_home` 的处理函数是空的？

```gdscript
# game_director.gd:853-854
func _on_ball_reached_home() -> void:
    pass  # ball crossed home plate — batting window still open, wait for pitch_ended
```

这里用 `pass` 是有意为之：`ball_reached_home` 发射时，击球窗口仍然打开（参见 `TIMING_SHIFT`），GameDirector 不需要立刻做任何事，等待玩家挥棒或 `pitch_ended` 发射。

保留这个连接是为了**文档目的**（代码注释说明了这是一个存在但暂不处理的事件）。

## 在项目里找这些内容

- `ball_controller.gd`:4-7 — 信号定义
- `runner_controller.gd`:6 — `reached_first_base` 信号
- `game_director.gd`:74-78 — 信号连接（`_ready` 函数内）
- `game_director.gd`:853-983 — 所有信号处理函数（`_on_*`）
