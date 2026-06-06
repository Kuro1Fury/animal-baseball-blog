# game_director.gd — 游戏总控

**文件路径**：`scripts/gameplay/game_director.gd`（984 行）

## 这个文件做什么

GameDirector 是整个游戏的调度中心。它不实现任何物理，但它决定：

- 什么时候投球
- 挥棒后发生什么
- 哪个守备员去接球
- 接球后进入传球还是踩垒流程
- 计分规则（Strike / Out / Safe / Force Out）
- HUD 和 Debug 信息显示

**如果说其他脚本是"功能模块"，那 GameDirector 就是把模块串联起来的"主线程"。**

## 先看：节点引用

`@onready` 是 GameDirector 最密集的部分。理解它引用了哪些节点，才能理解后续逻辑：

```gdscript
@onready var ball:            BallController = $"../Ball"
@onready var pitcher_spot:    Marker2D       = $"../PitcherSpot"
@onready var home_base:       Marker2D       = $"../HomeBase"
@onready var _defense_node                   = $"../Defense"      # 守备员父节点
@onready var _offense_node                   = $"../Offense"      # 进攻方父节点
@onready var _runner_controller: RunnerController = $"../RunnerController"
@onready var _batter_runner: CharacterBody2D = $"../Offense/BatterRunner"
@onready var _first_base_point: Marker2D     = $"../FirstBasePoint"
```

注意路径用 `../` 而不是直接子节点，因为 GameDirector 是场景的一个子节点，和其他节点是兄弟关系。

## 状态变量分类阅读

GameDirector 有大量状态变量，按功能分组理解：

**传球状态：**
```gdscript
var _throw_in_progress:      bool  # 球正在飞往目标
var _fielder_holding_ball:   bool  # 守备员拿着球，等待玩家输入
var _throw_source_fielder:   CharacterBody2D
var _throw_target_fielder:   CharacterBody2D
var _ball_holder_fielder:    CharacterBody2D
var _throw_target_position:  String  # "1B" / "SS" 等
```

**计分状态：**
```gdscript
var strike_count:   int   # 0-2
var out_count:      int   # 0-2
var _end_of_at_bat: bool  # 本轮打击已结束
```

**垒位状态：**
```gdscript
var first_base_occupied:   bool
var first_base_runner:     # 谁在一垒
var second_base_occupied:  bool
var second_base_runner:
var _runner_1b_advancing:  bool  # 一垒跑者正在推进到二垒
```

## 主循环：`_process(delta)`

```gdscript
func _process(delta: float) -> void:
    _update_runner_visuals()   # 更新跑者圆圈位置
    _update_hud_label()        # 更新计分 HUD
    _update_debug_label()      # 更新 Debug 信息

    if _setup_menu_open: return   # F10 菜单打开时冻结所有逻辑

    if _runner_1b_advancing:
        _advance_runner_1b(delta)  # 一垒→二垒推进动画

    if _reset_timer > 0.0:
        _reset_timer -= delta
        if _reset_timer <= 0.0: _do_reset()
        return

    # 传球追踪：球飞行时每帧更新目标位置
    if _throw_in_progress and _throw_target_fielder != null:
        ball.update_throw_target(_tf.to_local(_throw_target_fielder.global_position))

    # 路径 A：持球者走到垒旁 → 踩垒
    if _fielder_holding_ball and _active_fielder != null:
        if _active_fielder距离一垒 <= force_base_touch_radius:
            _do_fielder_stamp_first()
            return

    # 玩家输入
    if Input.is_action_just_pressed("action_primary"):
        ...
```

## 信号连接（`_ready`）

```gdscript
ball.ball_reached_home.connect(_on_ball_reached_home)
ball.pitch_ended.connect(_on_pitch_ended)
ball.ball_landed.connect(_on_ball_landed)
ball.throw_completed.connect(_on_throw_completed)
_runner_controller.reached_first_base.connect(_on_reached_first_base)
```

这 5 个信号是 GameDirector 响应游戏事件的主要入口。每个信号都有对应的 `_on_*` 处理函数。

## 调试快捷键一览

| 键 | 功能 |
|----|------|
| Space/Action | 投球 / 挥棒 / 传球到一垒 |
| R | 重置回合 |
| C | 切换自动接球 |
| V / F4 | 显示/隐藏击球时机区域可视化 |
| F1 | 切换 Debug 标签 |
| F2 | 切换动物名称标签 |
| F3 | 切换接球范围显示 |
| F5 | 切换传球轨迹线 |
| F10 | 打开/关闭 Training 配置面板 |
| Numpad 1-9 | 持球时按守备编号传球 |
| 1/2/3 | 强制下一球为高飞 / 地滚 / 普通 |
| 4/5/6/7 | 强制击球方向 |

## 推荐阅读顺序

1. `_do_swing()`（行 415）— 从挥棒开始理解一个回合
2. `_on_ball_landed()`（行 871）— 球落地后的分支逻辑
3. `_on_caught()`（行 700）— 接球后的三条路径
4. `_resolve_force_play()`（行 669）— Force Out / Safe 的最终判定
5. `_update_debug_label()`（行 259）— 理解所有调试信息的含义

## 读完后你应该能回答

1. `_reset_timer` 有什么用？为什么不直接调用 `_do_reset()`？
2. `_setup_menu_open` 为什么能"冻结"游戏？Godot 里通常用什么方法暂停游戏，这里为什么不用？
3. 一个回合的完整流程是什么（从玩家按下投球键，到下一球开始）？
4. `_process` 和 `_physics_process` 这里分别用在哪里？为什么这样分工？
