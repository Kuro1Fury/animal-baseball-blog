# 调试工具

> Godot 有完善的调试工具。了解它们能让你在开发中少走很多弯路。

## 输出与断言

### print / push_warning / push_error

```gdscript
print("普通输出")               # 打印到 Output 面板
print_rich("[color=red]红色[/color]")  # 富文本输出

push_warning("这是警告")        # 输出警告（黄色），继续运行
push_error("这是错误")          # 输出错误（红色），继续运行（不中断！）
```

注意：`push_error` **不会中断程序**，只是在 Output 面板显示红色错误。要让程序在错误时停止，用 `assert`。

### assert：断言

```gdscript
assert(condition)                     # 条件为 false 时，立即停止并报错
assert(condition, "错误说明")          # 带说明信息

assert(speed > 0.0, "速度不能为负数")
assert(target != null, "目标节点不能为 null")
```

`assert` 只在**调试构建**（Debug 模式）里生效，发布版本会自动移除，不影响性能。

**对 Java 开发者的类比**：和 Java 的 `assert` 完全一样的语义，但 Java 默认不开启断言（需要 `-ea` 参数），Godot 的 `assert` 在 Debug 模式自动开启。

项目里的用法：

```gdscript
# game_director.gd（隐式用法：push_warning 替代 assert）
push_warning("No defender at fielding_position: " + pos)
push_warning("Base Advancement v0.1: 2B occupied — runner advancement capped at 1B")
```

项目里用 `push_warning` 代替 `assert` 的场景是"不应该发生但不致命"的情况——记录警告，游戏继续运行。

## Godot 调试器

运行游戏时，点击底部的 **Debugger** 面板，可以：

### 调用栈（Call Stack）

程序崩溃或遇到 breakpoint 时，显示从哪里调用到这里的完整函数链。

**对 Java 开发者的类比**：就是 Stack Trace，和 Java 的一模一样。

### 变量监视（Inspector）

暂停时查看当前作用域的所有变量值——和 IDE debugger 的 Variables 面板相同。

### 错误面板

列出所有 `push_error` 和 `push_warning` 的调用，附带文件名和行号。

## Remote 场景树检查器

这是 Godot 独有的调试利器：游戏运行时，编辑器左侧的 **Scene** 面板会切换到 **Remote** 模式，实时显示当前场景树的状态。

你可以：
- 看到所有节点的当前层级
- 点击任意节点，在 Inspector 里查看它的所有属性（包括运行时的值）
- 看到动态创建的节点（比如 `AudioStreamPlayer.new()` 创建的节点会出现在树里）

**实际用途**：Animal Baseball 里调试传球线（`ThrowLine`）、跑者圆圈（`RunnerRing`）时，可以在 Remote 面板实时查看这些 Line2D 节点的 `points` 和 `visible` 属性。

## 性能监视器（Profiler）

Debugger 面板里的 **Profiler** 标签页，显示每帧各函数的耗时：

```
_process       0.12ms
_physics_process  0.08ms
draw           0.45ms
```

如果游戏卡顿，在 Profiler 里找耗时最长的函数。

**对 Java 开发者的类比**：类似 Java VisualVM 或 JProfiler 的 CPU 采样功能。

## 项目里的调试系统

Animal Baseball 有一套完整的内置调试可视化，直接通过键盘控制：

```gdscript
# game_director.gd
KEY_F1: _show_debug_ui     = !_show_debug_ui      # 开关调试标签
KEY_F2: _show_labels       = !_show_labels          # 开关动物名字标签
KEY_F3: _show_catch_ranges = !_show_catch_ranges    # 开关接球范围圆圈
KEY_F4: _toggle_zones()                             # 开关击球时机可视化
KEY_F5: _show_throw_line   = !_show_throw_line      # 开关传球轨迹线
```

Debug 标签（`DebugLabel`）实时显示：

```
Phase: Fielding  Ball: HIT_FLYING
z: 45.2  spd: 287 px/s
Fielder: eagle  AutoCatch: ON
Result: Perfect | 高飞球
...
```

这是一个很好的学习范例：**把调试信息直接渲染在游戏里**，不依赖 IDE 调试器，开发者直接在游戏画面里看到系统状态。

## 断点（Breakpoint）

在 GDScript 编辑器里点击行号左侧，设置断点：

```
→ ●  var t := pitch_elapsed / pitch_duration   ← 断点在这里
```

游戏运行到这行时会暂停，你可以检查变量、单步执行。和任何 IDE 的断点体验相同。

## @tool：在编辑器里运行脚本

```gdscript
@tool
extends Node2D

func _ready() -> void:
    # 这段代码在编辑器里也会执行（不仅仅是游戏运行时）
    _draw_preview()
```

`@tool` 让脚本在编辑器里实时运行，常用于：
- 程序化生成内容的预览（在编辑器里直接看到效果）
- 自定义编辑器插件

`FieldArt` 如果加上 `@tool`，就能在编辑器里实时看到场地的样子，不需要运行游戏。

## 常用调试技巧

### 1. 打印 Vector2

```gdscript
print("位置: ", position)           # 输出: 位置: (320, 240)
print("速度: %.1f" % velocity.length())  # 格式化输出
```

### 2. 打印枚举值

```gdscript
print(BallController.BallState.find_key(ball.state))  # 输出: PITCHING
```

### 3. 可视化调试（draw_line / draw_circle）

在 `_draw()` 方法里画临时调试线：

```gdscript
func _draw() -> void:
    draw_circle(Vector2.ZERO, 20.0, Color.RED)           # 红圈
    draw_line(Vector2.ZERO, target_pos, Color.GREEN, 2.0) # 绿线
queue_redraw()  # 在 _process 里调用，每帧重绘
```

这比 Line2D 节点更轻量，适合临时调试——但 Animal Baseball 选择了 Line2D 节点（更稳定，可控制显示/隐藏）。

## 在项目里找这些内容

- `game_director.gd`:259-319 — `_update_debug_label()`（完整的调试信息渲染示例）
- `game_director.gd`:251-257 — F1-F5 调试快捷键
- `game_director.gd`:623-625 — `push_warning()` 的使用
