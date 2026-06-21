# 2026-06-11 — 双杀（Double Play）

> Commit：`c6e571b`（共 1 个）

## 做了什么

`c6e571b` — Double Play v0.1：二垒封杀后，如果打者跑者还没到垒（仍是 Pending），守备员不放弃控制权，可以继续用 Numpad3 传一垒，完成一次双杀。

## 关键洞察：不需要新状态

实现双杀**没有新增任何 `double_play` 状态变量**，完全复用了 Multi-Result Play 的结构。

两个关键改动：

**1. `_resolve_force_play_2b()` 踩二垒后不放弃持球**

```gdscript
func _resolve_force_play_2b() -> void:
    _last_force_2b_state    = "Out"
    _runner_1b_to_2b_result = "Out"
    ...
    _add_runner_out()
    _check_play_results_complete()

    # 若 play 未结束（打者仍 Pending，未三出局）：重新进入持球状态
    if not _is_result_locked() and _batter_runner_to_1b_result == "Pending" \
            and _active_fielder != null:
        ball.catch()
        ball.visible          = false
        _fielder_holding_ball = true
        _active_fielder.controlled = true
        result_label.text    = "Force Out at 2B!\n%s" % hint_body
        result_label.visible = true
    else:
        _deactivate_fielder()
```

`_check_play_results_complete()` 发现 `_batter_runner_to_1b_result == "Pending"` 所以不进入 waiting。函数返回后，代码继续判断：play 没结束且打者还 Pending → 重新拿球，玩家保持控制。

**2. `_build_multi_result_text()` 识别双杀并加前缀**

```gdscript
func _build_multi_result_text() -> String:
    ...
    var text := "\n".join(parts) if not parts.is_empty() else "Out!"
    if _runner_1b_to_2b_result == "Out" and _batter_runner_to_1b_result == "Out":
        return "Double Play!\n" + text
    return text
```

两个 result 都是 `"Out"` → 文案变成 `"Double Play!\nForce Out at 2B!\nForce Out at 1B!"`。

## 整体执行流程

```
击球 → Runner1B 推进（Pending）+ 打者跑垒（Pending）
    ↓
守备员接球 → Numpad8 传二垒
    ↓
守备员持球走到二垒 → _do_fielder_stamp_second()
    ↓ _runner_1b_to_2b_result = "Out"，out_count +1
    _check_play_results_complete() → 打者还 Pending → 不进 waiting
    ↓ 重新进入持球状态，result_label 显示 "Force Out at 2B!"
守备员 Numpad3 传一垒
    ↓
一垒判定 → _batter_runner_to_1b_result = "Out"，out_count +1
    _check_play_results_complete() → 所有 result 已结算 → 进 waiting
    ↓
显示 "Double Play!\nForce Out at 2B!\nForce Out at 1B!"
```

## 读完你应该能回答

- 为什么双杀不需要专门的 `_double_play_in_progress` 状态变量？
- 如果二垒封杀时已经 3 outs（半局结束），还会进入持球状态让玩家传球吗？（提示：看 `_is_result_locked()`）
- `_build_multi_result_text()` 什么时候输出 "Double Play!"，什么时候不输出？

## 涉及文件

- `scripts/gameplay/game_director.gd` — `_resolve_force_play_2b()`、`_build_multi_result_text()`（+21 行/-2 行）
