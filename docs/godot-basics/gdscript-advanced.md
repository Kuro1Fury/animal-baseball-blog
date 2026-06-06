# GDScript 进阶：await、Callable、preload

> 掌握这三个特性，GDScript 里剩下 90% 的代码都能看懂。

## await：等待信号或协程

`await` 让当前函数"暂停"，等待一个信号或另一个协程完成，然后继续执行。

```gdscript
func _on_button_pressed() -> void:
    print("开始等待")
    await get_tree().create_timer(2.0).timeout  # 等待 2 秒
    print("2 秒后继续")
```

`get_tree().create_timer(2.0).timeout` 是一个常见的等待模式：
- `get_tree().create_timer(2.0)` 创建一个 2 秒计时器
- `.timeout` 是这个计时器发出的信号
- `await` 等待这个信号被触发

**关键**：`await` 不会阻塞整个游戏，只挂起**当前函数**。其他节点的 `_process()`、物理、输入正常运行。

**对 Java 开发者的类比**：类似 Java 的 `CompletableFuture.thenCompose()` 或 Kotlin 协程的 `delay()`——非阻塞挂起。

### await 信号

```gdscript
# 等待玩家按下按键
await Input.is_action_just_pressed("action_primary")

# 等待球落地
await ball.ball_landed

# 等待动画结束
var tw := create_tween()
tw.tween_property(label, "scale", Vector2.ONE, 0.5)
await tw.finished
```

### 实际用途：序列化异步逻辑

不用回调地狱，用 await 写线性逻辑：

```gdscript
# 不用 await（回调式，难读）
func _start_sequence() -> void:
    ball.ball_landed.connect(func():
        get_tree().create_timer(1.0).timeout.connect(func():
            _do_reset()
        )
    )

# 用 await（线性式，易读）
func _start_sequence() -> void:
    await ball.ball_landed
    await get_tree().create_timer(1.0).timeout
    _do_reset()
```

Animal Baseball 目前用 `_reset_timer` 浮点倒计时代替了 await（见[Timer 章节](/godot-basics/timer)），两种方式都是合理的选择。

## Callable：把函数当参数传

`Callable` 是对"一个函数引用"的封装，类似 Java 的 `Runnable`、`Consumer<T>` 或方法引用。

### 基本用法

```gdscript
# 把函数引用赋值给变量
var fn: Callable = _on_ball_landed     # 引用成员函数
var fn2: Callable = SomeClass.static_method  # 引用静态函数

# 调用
fn.call()           # 调用，等同于 _on_ball_landed()
fn2.call(arg1, arg2)
```

### 最常见的场景：信号连接

```gdscript
# 最简单写法：直接连接成员函数
ball.ball_landed.connect(_on_ball_landed)

# 等同于：
ball.ball_landed.connect(Callable(self, "_on_ball_landed"))
```

### Lambda（匿名函数）

GDScript 支持 `func()` 匿名函数，常用于一次性的简单回调：

```gdscript
# 使用 Lambda 连接信号（适合简单逻辑）
apply_btn.pressed.connect(func():
    setup_applied.emit(0, 0, "empty")
    hide()
)

# 带参数的 Lambda
var doubler := func(x: int) -> int: return x * 2
print(doubler.call(5))  # 输出 10
```

**对 Java 开发者的类比**：

```java
// Java lambda
button.addActionListener(e -> {
    applySetup(0, 0, "empty");
    this.hide();
});
```

```gdscript
# GDScript lambda
apply_btn.pressed.connect(func():
    setup_applied.emit(0, 0, "empty")
    hide()
)
```

语法非常相似。

### bind()：预绑定参数

```gdscript
# 信号没有参数，但回调需要参数时，用 bind() 预填充
signal some_signal

some_signal.connect(_on_thing.bind("hello", 42))

func _on_thing(message: String, number: int) -> void:
    print(message, number)  # 信号触发时输出 hello42
```

**对 Java 开发者的类比**：类似 `Function::apply` 的 partial application，或 Guava 的 `Functions.compose`。

### call_deferred()：延迟调用

```gdscript
# 立即调用
node.some_method()

# 延迟到当前帧结束后调用（物理帧安全）
node.call_deferred("some_method")
node.call_deferred("some_method", arg1, arg2)
```

`call_deferred` 常用于在物理帧中间需要修改物理状态的场景（直接修改会报警告）：

```gdscript
# game_director.gd _ready()
_batter_runner.get_node("CollisionShape2D").set_deferred("disabled", true)
```

`set_deferred("property", value)` 是 `call_deferred("set", "property", value)` 的简写。

## preload vs load

两者都用于加载资源（图片、场景、音频等），区别在于**时机**：

```gdscript
# preload：编译时加载，脚本加载时立即读取资源到内存
var scene: PackedScene = preload("res://scenes/Bullet.tscn")

# load：运行时加载，调用时才读取
var texture: Texture2D = load("res://assets/sprites/eagle/eagle_idle.png")
```

| | `preload` | `load` |
|-|-----------|--------|
| 加载时机 | 脚本编译/加载时 | 函数调用时 |
| 路径 | **必须是字面量字符串**（编译时已知）| 可以是变量 |
| 性能 | 提前加载，运行时无延迟 | 按需加载，首次可能有延迟 |
| 适合 | 固定资源（必然用到的场景、图片）| 动态路径（根据变量决定加载什么）|

项目里用 `load()` 而不是 `preload()`，因为路径是动态拼接的：

```gdscript
# animal_controller.gd — 路径是变量，必须用 load
var path := "res://assets/sprites/animals/%s/%s_idle.png" % [folder, folder]
$Sprite2D.texture = load(path)

# game_director.gd — 路径是变量，必须用 load
var candidate := "res://assets/audio/sfx/sfx_%s.%s" % [key, ext]
player.stream = load(candidate)
```

### ResourceLoader.exists()

在 `load()` 之前先检查资源是否存在，避免加载不存在的文件报错：

```gdscript
if ResourceLoader.exists(path):
    $Sprite2D.texture = load(path)
```

**对 Java 开发者的类比**：类似 `Files.exists(path)` 检查文件存在再读取。

## 类型转换

```gdscript
var x: Variant = 42
var y: int = x as int       # 类型转换（失败返回 null，不报错）
var z: int = int(x)         # 强制转换（失败报错）

# 类型检查
if x is int:
    print("x is an integer")
```

**对 Java 开发者的类比**：
- `x as int` ≈ Java `(Integer) x`（失败不抛异常，返回 null/0）
- `x is int` ≈ Java `x instanceof Integer`

## 字符串格式化

```gdscript
# % 格式化（类似 Python）
"Ball: %s  z: %.1f" % [state_name, ball.height_z]
"sfx_%s.%s" % [key, ext]

# 等同于 Java 的 String.format
String.format("Ball: %s  z: %.1f", stateName, ball.heightZ);
```

`%s`：字符串，`%d`：整数，`%f`：浮点，`%.1f`：保留 1 位小数。

## 在项目里找这些内容

- `game_director.gd`:98-99 — `_training_panel.setup_applied.connect(...)` 信号连接
- `animal_controller.gd`:39-45 — `load()` 动态加载图片
- `game_director.gd`:121-135 — `load()` 动态加载音频
- `game_director.gd`:92-95 — `set_deferred()` 延迟修改物理属性
- `game_director.gd`:318 — `%s` 字符串格式化
