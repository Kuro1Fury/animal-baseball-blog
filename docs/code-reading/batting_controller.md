# batting_controller.gd — 击球判定系统

**文件路径**：`scripts/gameplay/batting_controller.gd`（56 行）

## 这个文件做什么

BattingController 是一个纯工具类（`extends RefCounted`），只包含 `static` 函数。它回答两个问题：

1. 玩家挥棒的时机属于哪个结果（Perfect / Good / Early / Late / Miss）？
2. 这个结果对应什么击球参数（方向 / 速度 / 垂直速度）？

**没有状态，没有节点，不需要实例化**。直接调用 `BattingController.judge(...)` 即可。

## 两个核心函数

### `judge(pitch_elapsed, pitch_duration) → String`

传入球已飞行的时间 + 总投球时长，返回判定结果。

```gdscript
static func judge(pitch_elapsed: float, pitch_duration: float) -> String:
    if pitch_elapsed < pitch_duration * EARLY_MIN_T:
        return "Miss"
    var center := pitch_duration * (1.0 + TIMING_SHIFT)  # 最佳时机点
    var delta  := pitch_elapsed - center                   # 相对偏差
    if absf(delta) <= PERFECT_WINDOW: return "Perfect"
    if absf(delta) <= GOOD_WINDOW:    return "Good"
    if delta < -GOOD_WINDOW:          return "Early"
    return "Late"
```

### `calc_hit_params(result) → Dictionary`

传入判定结果，返回击球的物理参数字典：`{direction, speed, vz}`。

## 时间窗口的实际数值

以 `pitch_duration = 1.5s` 为例：

| 事件 | 时间点 |
|------|--------|
| 投球开始 | t = 0.0s |
| 球到达本垒（`t=1.0`）| t = 1.5s |
| 最佳击球中心 | t = 1.65s（= 1.5 × 1.10）|
| Perfect 窗口 | 1.60s ~ 1.70s |
| Good 窗口 | 1.53s ~ 1.77s |
| Miss（太早）| t < 0.6s |

## `vz` 与球的类型

`vz`（垂直初速度）是连接击球与守备系统的桥梁：

| 结果 | vz 范围 | 球的类型 | 主要守备员 |
|------|---------|----------|-----------|
| Perfect | 120 ~ 220 | 高飞球 | 鹰 |
| Good | 40 ~ 150 | 混合 | 猴子 / 蜥蜴 |
| Early / Late | 20 ~ 60 | 偏地滚 | 鳄鱼 |

`vz` 还被 `FieldingJudge.select_fielder(vz)` 用来选择守备类型：

```gdscript
# fielding_judge.gd
static func select_fielder(vz: float) -> String:
    var peak := vz * vz / (2.0 * BallController.GRAVITY)  # 物理：抛物线最高点
    if peak >= HIGH_PEAK: return "eagle"   # 最高点 ≥ 60px → 高飞球
    if peak  < LOW_PEAK:  return "croc"   # 最高点 < 20px → 地滚球
    return "monkey"
```

## 方向向量的几何含义

```gdscript
"Perfect":
    var a := randf_range(-0.2, 0.2)
    return {"direction": Vector2(sin(a), -cos(a)), ...}
```

- `a` 是偏离正前方的角度（弧度）
- `Vector2(sin(a), -cos(a))` 是单位向量，指向屏幕上方（-y 方向）+ 少量左右偏移
- `Perfect` 的 `a` 范围小（±0.2 rad ≈ ±11°），打向中间外野
- `Early` 的 `a` 为正值，`x = -sin(a)` → 偏向三垒（屏幕左侧）

## 读完后你应该能回答

1. 为什么 `center` 是 `pitch_duration * (1.0 + TIMING_SHIFT)` 而不是 `pitch_duration * 1.0`？
2. `vz` 和 `hit_velocity` 各控制什么？它们独立还是相关？
3. `Early` 打出的球为什么会偏向三垒？从 `calc_hit_params` 的代码里找证据。
4. 如果我想让 `Perfect` 的速度更快，应该改哪个常量？

## 涉及文件

- `scripts/gameplay/batting_controller.gd` — 全部（56 行，推荐完整阅读）
- `scripts/gameplay/game_director.gd`:415-445 — `_do_swing()`（调用方）
