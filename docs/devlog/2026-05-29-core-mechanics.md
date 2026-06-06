# 2026-05-29 — 投球、挥棒、地滚球（同一天）

> Commits：`f91040b` `b6ea68a` `3d1dc5d` `24fa838` `822f886` `fb5b903` `0f9167c` `bec3736`（共 8 个）

## 做了什么

这一天是整个游戏核心机制的奠基日。令人惊讶的是，**投球、挥棒判定、地滚球物理** 三个系统都在同一天完成了原型：

| Commit | 内容 |
|--------|------|
| `f91040b` | 实现可移动像素点（第一个可交互 CharacterBody2D）|
| `b6ea68a` | 基础投球逻辑（BallController 雏形）|
| `3d1dc5d` | 完成挥棒判定（BattingController 成形）|
| `24fa838` | week3 日志 |
| `822f886` | 动物澄清 |
| `fb5b903` | week4 初版 |
| `0f9167c` | 地滚球逻辑 |
| `bec3736` | 地滚修复和最低 z 设定 |

"week2/3/4" 是开发者对阶段的标记，不是真实周数。实际上同一天就完成了三个阶段。

## 投球：从 from 到 to 的弧线

```gdscript
# ball_controller.gd:93-104
func _tick_pitching(delta: float) -> void:
    pitch_elapsed += delta
    var t := pitch_elapsed / pitch_duration   # t 不截断，继续增长到球出界
    plane_pos = _pitch_from.lerp(_pitch_to, t)
    height_z  = maxf(0.0, (pitch_peak_z - pitch_arrive_z * 0.5) * 4.0 * t * (1.0 - t) + pitch_arrive_z * t)
```

`4t(1-t)` 是标准抛物线形状，`pitch_arrive_z * t` 保证球到本垒时有一定高度。

## 挥棒：时机窗口判定

```gdscript
# batting_controller.gd:21-29
static func judge(pitch_elapsed: float, pitch_duration: float) -> String:
    if pitch_elapsed < pitch_duration * EARLY_MIN_T:
        return "Miss"                              # 太早
    var center := pitch_duration * (1.0 + TIMING_SHIFT)
    var delta  := pitch_elapsed - center
    if absf(delta) <= PERFECT_WINDOW: return "Perfect"
    if absf(delta) <= GOOD_WINDOW:    return "Good"
    if delta < -GOOD_WINDOW:          return "Early"
    return "Late"
```

最佳时机在球**过了本垒之后** 10%（`TIMING_SHIFT = 0.10`），模拟"等球进来再打"。

## 地滚球：z 阈值 + 摩擦减速

飞球落地的判断条件（`bec3736` 中确定了阈值）：

```gdscript
# ball_controller.gd:116-119
if height_z <= GROUND_BALL_HEIGHT_THRESHOLD and vertical_velocity < 0.0:
    state = BallState.GROUND_ROLLING
```

地滚球减速直到停止：

```gdscript
hit_velocity = hit_velocity.move_toward(Vector2.ZERO, ground_friction * delta)
if hit_velocity.length() < min_ground_speed:
    state = BallState.DEAD
```

## 读完你应该能回答

- 投球弧线公式里，哪一项控制弧顶高度，哪一项控制落点高度？
- 为什么 `TIMING_SHIFT` 不是 0（即最佳时机不在球到本垒的那一刻）？
- 地滚球停止的条件是什么？`min_ground_speed` 存在的意义？

## 涉及文件

- `scripts/ball/ball_controller.gd` — `_tick_pitching()`、`_tick_hit_flying()`、`_tick_ground_rolling()`
- `scripts/gameplay/batting_controller.gd` — 全部
