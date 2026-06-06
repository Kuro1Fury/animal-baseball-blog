# Tween：动画与过渡

> Tween 是 Godot 里做"渐变动画"最轻量的方式——不需要 AnimationPlayer，一行代码就能驱动任意属性的插值变化。

## 什么是 Tween

Tween（补间动画）负责把某个属性从 A **平滑过渡**到 B，持续指定时间。

最常见的场景：
- UI 元素淡入淡出
- 节点缩放弹出效果
- 颜色渐变
- 位置移动

**对 Java 开发者的类比**：类似 Android 的 `ObjectAnimator` 或 CSS 的 `transition`——声明"哪个属性"从"什么值"到"什么值"，持续"多久"，框架帮你每帧更新。

## 基本用法

```gdscript
# 创建一个 Tween（每次 create_tween() 都是全新的）
var tw := create_tween()

# 让 result_label 的 scale 在 0.2 秒内从当前值变到 Vector2.ONE
tw.tween_property(result_label, "scale", Vector2.ONE, 0.2)
```

`tween_property(object, property, final_value, duration)`：
- `object`：要动画的节点
- `property`：属性路径（字符串，支持嵌套如 `"position:x"`）
- `final_value`：目标值
- `duration`：持续秒数

## 链式调用：顺序播放

`create_tween()` 返回的 Tween 对象支持链式调用，多个 `tween_property` 会**按顺序**执行：

```gdscript
# animal_controller.gd — flash_catch() 的实现
func flash_catch() -> void:
    var tw := create_tween()
    tw.tween_property($HighlightRing, "width", 10.0, 0.05)   # 第一步：宽度扩大到 10，历时 0.05s
    tw.tween_property($HighlightRing, "width",  3.0, 0.18)   # 第二步：宽度收回到 3，历时 0.18s
        .set_ease(Tween.EASE_OUT)                             # 缓动：先快后慢
```

效果：圆圈快速闪亮 → 缓慢收回，视觉上像"接球闪光"。

## 在项目里的应用

### 结果标签弹出（game_director.gd）

```gdscript
func _show_result(text: String) -> void:
    result_label.text    = text
    result_label.visible = true
    result_label.scale   = Vector2(1.5, 1.5)   # 先放大到 1.5 倍
    var tw := create_tween()
    tw.tween_property(result_label, "scale", Vector2.ONE, 0.2)  # 0.2s 收回正常大小
        .set_ease(Tween.EASE_OUT)
```

效果：文字"弹出"出现，类似游戏里的得分提示动画。

### 守备员接球闪光（animal_controller.gd）

```gdscript
func flash_catch() -> void:
    var tw := create_tween()
    tw.tween_property($HighlightRing, "width", 10.0, 0.05)
    tw.tween_property($HighlightRing, "width",  3.0, 0.18).set_ease(Tween.EASE_OUT)
```

## 缓动曲线（Ease）

`.set_ease()` 控制动画的速度曲线：

| 缓动 | 含义 | 视觉感受 |
|------|------|---------|
| `Tween.EASE_IN` | 先慢后快 | 加速 |
| `Tween.EASE_OUT` | 先快后慢 | 减速（最常用，感觉自然）|
| `Tween.EASE_IN_OUT` | 先慢后快再慢 | 平滑 |
| `Tween.EASE_OUT_IN` | 先快后慢再快 | 弹性感 |

还可以配合 `.set_trans()` 设置插值类型（线性、弹性、弹跳等）：

```gdscript
tw.tween_property(node, "position", target, 0.5)
    .set_ease(Tween.EASE_OUT)
    .set_trans(Tween.TRANS_BOUNCE)  # 弹跳效果
```

## tween_callback：在动画中插入代码

```gdscript
var tw := create_tween()
tw.tween_property(label, "modulate:a", 0.0, 0.5)  # 淡出
tw.tween_callback(label.hide)                       # 淡出完成后隐藏节点
tw.tween_callback(func(): do_next_thing())          # 也可以用 Lambda
```

`tween_callback` 在时间线上的当前位置插入一个"回调"，动画到这里时执行。

## 并行播放（parallel）

默认 Tween 是顺序的（前一个完成才开始下一个）。用 `.set_parallel(true)` 或 `.parallel()` 让多个属性同时动画：

```gdscript
var tw := create_tween()
tw.set_parallel(true)
tw.tween_property(node, "position", Vector2(100, 0), 0.5)
tw.tween_property(node, "modulate:a", 0.0, 0.5)     # 同时移动 + 淡出
```

## create_tween() 每次都是新的

每次调用 `create_tween()` 都会创建一个新 Tween，**旧的 Tween 会被停止**（如果还在运行）。

```gdscript
# 重复调用 flash_catch() 不会叠加，因为每次都创建新 Tween
func flash_catch() -> void:
    var tw := create_tween()  # 旧的 Tween 自动停止
    tw.tween_property(...)
```

这和某些动画系统（如 Android 的 ValueAnimator）需要手动 cancel 不同，Godot 帮你管理了。

## Tween vs AnimationPlayer

| | Tween | AnimationPlayer |
|-|-------|----------------|
| 适合场景 | 代码驱动的简单过渡 | 复杂、多轨道、可复用的动画 |
| 创建方式 | 纯代码 | 编辑器里关键帧 |
| 灵活性 | 高（运行时参数）| 低（预设动画）|
| 项目里使用 | `flash_catch()`、`_show_result()` | 未使用（暂无角色动画需求）|

Animal Baseball 全部用 Tween，因为动画都是响应游戏事件的一次性过渡，不需要编辑器里预设关键帧。

## 在项目里找这些内容

- `animal_controller.gd`:54-57 — `flash_catch()`（两段式 Tween）
- `game_director.gd`:941-944 — `_show_result()`（标签弹出动画）
