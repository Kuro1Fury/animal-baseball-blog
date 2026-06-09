# 2026-06-09 — 手动确认下一球 & 多结果 Play

> Commit：`f9f8a0e`、`5d5f53b`（共 2 个）

## 做了什么

这两个 commit 解决了两个关键问题：

1. **`f9f8a0e` — Manual Next Play v0.1**：结果展示后不再自动倒计时重置，改为等玩家按 Space/A 确认。同时修复了 Path A2（SS 也可踩二垒）以及二垒封杀后打者安全上一垒的逻辑。
2. **`5d5f53b` — Multi-Result Play v0.1**：引入"双 runner 结果跟踪"机制，解决同一球两个跑者结果需要同时等待、合并展示的问题。同时修复了飞球接杀时 Runner1B 未能回垒的 bug。

---

## f9f8a0e — Manual Next Play v0.1

### 为什么改成手动确认？

原来用 `_reset_timer`（倒计时 1.5~2.5 秒自动重置），玩家来不及看清结果就进入下一球了。改成"显示结果 + 等 Space/A"体验更好，调试时也更容易暂停观察。

### 新增状态变量

```gdscript
var _waiting_for_next_play   := false
var _next_play_confirm_timer := 0.0
var _waiting_reset_mode      := ""  # "pitch" or "at_bat"
```

`_waiting_reset_mode` 区分两种重置：
- `"pitch"`：Strike 1/2，只重置本球（保留 strike 计数）→ `_reset_current_play_only()`
- `"at_bat"`：Safe/Out/StrikeOut，结算整个 at-bat → `_do_reset()`

### 核心函数 `_enter_waiting_for_next_play()`

所有结果路径（Strike、Safe、Out、Force Out）都统一改为调用这一个函数：

```gdscript
func _enter_waiting_for_next_play(result_text: String, mode: String) -> void:
    _show_result(result_text + "\nSpace / A → Next")
    _waiting_for_next_play   = true
    _next_play_confirm_timer = 0.0
    _waiting_reset_mode      = mode
```

### waiting 期间什么仍在运行？

`_process()` 里把 waiting 检查放在 runner 推进和踩垒判定的**后面**：

```gdscript
func _process(delta: float) -> void:
    if _setup_menu_open: return

    # ✅ 这段仍在运行（不受 waiting 影响）
    if _runner_1b_advancing:
        _advance_runner_1b(delta)

    # 路径 A、A2（踩垒判定）—— 仍在运行
    if _fielder_holding_ball and _active_fielder != null:
        ...

    # ❌ waiting 期间从这里 return，冻结投球/挥棒/传球 input
    if _waiting_for_next_play:
        _next_play_confirm_timer += delta
        if Input.is_action_just_pressed("action_primary") \
                and _next_play_confirm_timer >= next_play_confirm_delay:
            if _waiting_reset_mode == "pitch":
                _reset_current_play_only()
            else:
                _do_reset()
        return
```

`next_play_confirm_delay`（默认 0.35 秒）防止玩家在前一次按键的余量里意外触发确认。

### Path A2 修复：去掉 `_throw_target_position == "2B"` 限制

```gdscript
# 修复前：只有主动传 2B 的持球者才能踩
if _fielder_holding_ball and _active_fielder != null \
        and _throw_target_position == "2B" and _runner_1b_advancing:

# 修复后：任何持球守备员走到二垒均可封杀
if _fielder_holding_ball and _active_fielder != null \
        and _runner_1b_advancing:
```

这样 SS 接球后持球走到二垒也能触发封杀。

---

## 5d5f53b — Multi-Result Play v0.1

### 问题背景

一垒有跑者时击出地滚球，同一球会产生**两个跑者的结果**：
- Runner1B → 推进到二垒（Safe or Force Out at 2B）
- 打者跑者 → 跑到一垒（Safe or Force Out at 1B）

原来的单结果系统只能处理先结算的那个，另一个的结果无法合并展示。

### 双结果变量

```gdscript
var _runner_1b_to_2b_result    := "None"   # None / Pending / Safe / Out
var _batter_runner_to_1b_result := "None"  # None / Pending / Safe / Out
```

击球时初始化：
```gdscript
func _do_swing() -> void:
    _batter_runner_to_1b_result = "Pending"  # 打者跑者总是有结果
    if first_base_occupied and not second_base_occupied:
        _runner_1b_to_2b_result = "Pending"  # Runner1B 开始推进
    else:
        _runner_1b_to_2b_result = "None"     # 无跑者或二垒已满
```

### `_check_play_results_complete()` — 屏障函数

每次某个 runner 的结果被设置后都调用这个函数。只有**所有 Pending 都结算完**才进入 waiting：

```gdscript
func _check_play_results_complete() -> void:
    if _is_result_locked(): return
    if out_count >= 3:
        _enter_waiting_for_next_play(_build_multi_result_text() + "\nHalf Inning Over!", "at_bat")
        return
    if _runner_1b_to_2b_result == "Pending": return   # 还在等二垒结果
    if _batter_runner_to_1b_result == "Pending": return  # 还在等一垒结果
    _enter_waiting_for_next_play(_build_multi_result_text(), "at_bat")
```

3 outs 优先：不管其他 runner 的 result 是否还 Pending，满 3 outs 立即结算。

### `_build_multi_result_text()` — 拼接结果文案

```gdscript
func _build_multi_result_text() -> String:
    var parts: Array[String] = []
    if _runner_1b_to_2b_result == "Out":    parts.append("Force Out at 2B!")
    elif _runner_1b_to_2b_result == "Safe": parts.append("Runner Safe at 2B!")
    if _batter_runner_to_1b_result == "Out":    parts.append("Force Out at 1B!")
    elif _batter_runner_to_1b_result == "Safe": parts.append("Safe!")
    return "\n".join(parts) if not parts.is_empty() else "Out!"
```

典型结果文案示例：
- 双封杀：`Force Out at 2B!\nForce Out at 1B!`
- 二垒封杀 + 打者安全：`Force Out at 2B!\nSafe!`
- 双安全：`Runner Safe at 2B!\nSafe!`

### `_add_runner_out()` — 不触发 waiting 的 helper

原来 Force Out 直接调用 `_register_out()`，但 `_register_out()` 会立刻进入 waiting。Multi-Result 需要先累积所有 out，再由 `_check_play_results_complete()` 统一决定何时进 waiting：

```gdscript
func _add_runner_out() -> void:
    out_count     += 1
    _end_of_at_bat = true
    _play_sfx("out")
    # 不调用 _enter_waiting_for_next_play()
```

Force Out at 1B/2B 都改用 `_add_runner_out()` + `_check_play_results_complete()`。Fly Out / Strike Out 仍然走 `_register_out()`，因为这两种情况不存在等待另一个 runner 的场景。

### Fly Out Runner1B 回垒修复

飞球接杀之前，Runner1B 可能已经在推进。规则是飞球接杀后跑者必须回垒（MVP 简化：不做 tag up 动画，直接传送回垒）：

```gdscript
func _on_caught() -> void:
    var was_advancing := _runner_1b_advancing
    if _runner_1b_advancing:
        _runner_1b_advancing = false
        _runner_1b.visible   = false  # 暂时隐藏
    _runner_1b_to_2b_result    = "None"
    _batter_runner_to_1b_result = "None"
    ...
    _register_out("Fly Out!")
    if was_advancing and out_count < 3:
        _cancel_runner_1b_advancement_back_to_first_for_flyout()
```

`_cancel_runner_1b_advancement_back_to_first_for_flyout()` 直接把 runner 位置设回一垒，重新显示、重置占垒状态。3 outs 时由 `_do_reset()` 统一清空，不需要单独还原。

## 读完你应该能回答

- `_waiting_reset_mode` 的 `"pitch"` 和 `"at_bat"` 分别对应什么情况，重置范围有什么区别？
- 为什么不直接在 `_resolve_force_play_2b()` 里调用 `_enter_waiting_for_next_play()`，而要改用 `_check_play_results_complete()`？
- `_runner_1b_to_2b_result == "Pending"` 还没结算时，Runner1B 到达二垒会触发什么？（提示：`_on_runner_1b_reached_second()`）
- Fly Out 时为什么先把 runner 隐藏，再还原到一垒，而不是直接移动？

## 涉及文件

- `scripts/gameplay/game_director.gd` — 所有改动（`f9f8a0e` +65/-33 行，`5d5f53b` +112/-52 行）
