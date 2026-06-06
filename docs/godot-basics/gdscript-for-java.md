# GDScript 速览（Java 开发者视角）

> GDScript 是 Godot 的专用脚本语言，语法接近 Python。如果你熟悉 Java，大多数概念都有直接对应，只是写法不同。

## 整体印象

```gdscript
# GDScript
class_name BallController
extends Node2D

@export var pitch_duration: float = 1.5

var state: BallState = BallState.IDLE
var plane_pos := Vector2.ZERO   # 类型推断

func start_pitch(from: Vector2, to: Vector2) -> void:
    _pitch_from = from
    state = BallState.PITCHING

static func judge(elapsed: float, duration: float) -> String:
    if elapsed < duration * 0.4:
        return "Miss"
    return "Hit"
```

```java
// 对应的 Java 写法（概念上）
public class BallController extends Node2D {
    public float pitchDuration = 1.5f;  // @export ≈ public field

    private BallState state = BallState.IDLE;
    private Vector2 planePos = Vector2.ZERO;

    public void startPitch(Vector2 from, Vector2 to) {
        this.pitchFrom = from;
        this.state = BallState.PITCHING;
    }

    public static String judge(float elapsed, float duration) {
        if (elapsed < duration * 0.4f) return "Miss";
        return "Hit";
    }
}
```

## 语法对照表

### 变量声明

```gdscript
var x: int = 0          # 显式类型
var x := 0              # 类型推断（推断为 int）
var x = 0               # 无类型（动态，不推荐）
const MAX := 100        # 常量（编译时确定）
```

```java
int x = 0;
var x = 0;              // Java 10+ 局部变量推断
final int MAX = 100;
```

### 函数定义

```gdscript
func greet(name: String) -> String:
    return "Hello " + name

static func add(a: int, b: int) -> int:
    return a + b

func no_return() -> void:
    print("done")
```

```java
public String greet(String name) { return "Hello " + name; }
public static int add(int a, int b) { return a + b; }
public void noReturn() { System.out.println("done"); }
```

### 条件与循环

```gdscript
if x > 0:
    print("positive")
elif x == 0:
    print("zero")
else:
    print("negative")

for i in 10:           # 0..9，等同于 for(int i=0;i<10;i++)
    print(i)

for item in array:     # 等同于 for(var item : array)
    print(item)

while condition:
    do_something()
```

**注意**：GDScript 用**缩进**表示代码块，没有花括号。

### match（等同于 switch，但更强大）

```gdscript
match state:
    BallState.PITCHING:
        _tick_pitching(delta)
    BallState.HIT_FLYING:
        _tick_hit_flying(delta)
    _:                      # 等同于 default
        pass
```

```java
switch (state) {
    case PITCHING -> tickPitching(delta);
    case HIT_FLYING -> tickHitFlying(delta);
    default -> {}
}
```

## 类型系统

GDScript 是**动态类型**语言，但支持可选的类型注解（推荐加上）：

```gdscript
var x = "hello"    # 动态，可以之后赋为 42（不报错，但不推荐）
var x: String = "hello"  # 静态类型注解，赋非 String 会报错
```

Godot 内置类型：

| GDScript | Java 对应 |
|----------|-----------|
| `int` | `int` / `long` |
| `float` | `double` |
| `bool` | `boolean` |
| `String` | `String` |
| `Vector2` | 没有直接对应（(x,y) 坐标）|
| `Array` | `ArrayList` |
| `Dictionary` | `HashMap` |
| `PackedVector2Array` | `float[]`（内存连续数组）|

## `@` 注解

GDScript 里的 `@` 注解（叫 Annotation）类似 Java 注解，由 Godot 引擎处理：

| GDScript 注解 | 类比 | 作用 |
|---------------|------|------|
| `@export` | `@Value` / public 字段 | 在 Inspector 面板暴露变量 |
| `@onready` | `@Autowired` | 在 `_ready()` 时解析节点引用 |
| `@tool` | - | 让脚本在编辑器里也运行 |

## class_name 与继承

```gdscript
class_name BallController   # 注册全局类名，其他文件可以直接用这个类名
extends Node2D              # 继承
```

`class_name` 注册后，其他文件不需要 import，直接写 `BallController.some_method()` 即可。这和 Java 的 `public class` + 同包无需导入类似，但作用域是全局的。

## 枚举

```gdscript
enum BallState { IDLE, PITCHING, HIT_FLYING, GROUND_ROLLING, CAUGHT, THROWING, DEAD }

var state: BallState = BallState.IDLE
```

```java
enum BallState { IDLE, PITCHING, HIT_FLYING, GROUND_ROLLING, CAUGHT, THROWING, DEAD }

BallState state = BallState.IDLE;
```

枚举语法几乎一样，但 GDScript 的枚举是整数常量，没有 Java 枚举的方法和字段能力。

## 没有访问修饰符

GDScript **没有** `private` / `protected` / `public`。

惯例：以 `_` 开头的变量和函数表示"内部使用"（类似 Python）：

```gdscript
var _pitch_from := Vector2.ZERO    # 约定为内部变量
func _tick_pitching(delta) -> void: # 约定为内部函数
```

但这只是命名约定，语言层面不做任何限制。

## 空值与 null 检查

```gdscript
if node == null:
    return
if node != null and node.is_valid():
    node.do_something()
```

GDScript 没有 Optional，用 null 检查。注意 Godot 对象有时需要用 `is_instance_valid()` 而不是 `!= null`（因为节点可能已经被销毁但引用还在）。

## 常用内置函数

```gdscript
print("debug")            # System.out.println
push_warning("warn")      # logger.warn
push_error("error")       # logger.error
absf(x)                   # Math.abs（float 版）
maxf(a, b)                # Math.max（float 版）
minf(a, b)                # Math.min（float 版）
randf_range(min, max)     # ThreadLocalRandom.current().nextDouble(min, max)
clamp(x, min, max)        # Math.clamp（Java 21+）
```

## `_` 前缀：有意忽略的变量

```gdscript
func _physics_process(_delta: float) -> void:
    # _delta 表示"我知道有这个参数，但不用它"
    pass
```

等同于 Java 里的 `@SuppressWarnings("unused")` 或 Kotlin 的 `_`，消除未使用变量警告。

## 在项目里读代码的建议

打开任意 `.gd` 文件时，先看：
1. `class_name` 和 `extends` — 知道这是什么类型的节点
2. `@export` 变量 — 这些是可配置的参数
3. `@onready` 变量 — 这是它依赖的其他节点
4. `signal` 定义 — 这个类会发出哪些事件
5. `_ready()` — 初始化逻辑
6. `_process()` / `_physics_process()` — 主循环逻辑

这个顺序读下来，相当于 Java 里先看字段声明 → 构造函数 → 核心方法。
