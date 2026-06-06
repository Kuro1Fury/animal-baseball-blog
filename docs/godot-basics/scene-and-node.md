# Scene 与 Node：Godot 的基本单元

> 如果你只能从 Godot 里学一个概念，那就是这个。

## Node 是什么

Godot 里所有的东西都是 **Node（节点）**。Node 是游戏世界里的基本对象，类似于 Java 里的对象实例——但它有两个额外特性：

1. **生命周期回调**：Godot 在特定时机自动调用 `_ready()`、`_process()` 等方法
2. **树形层级**：每个 Node 有且只有一个父节点，可以有多个子节点

常见的 Node 类型举例：

| Node 类型 | 用途 |
|-----------|------|
| `Node2D` | 2D 世界里有位置的基本节点 |
| `CharacterBody2D` | 可以移动、碰撞的物理角色 |
| `Sprite2D` | 显示图片 |
| `Label` | 显示文字 |
| `Marker2D` | 空的位置标记点（只有坐标，无视觉）|
| `AudioStreamPlayer` | 播放音频 |
| `Line2D` | 绘制折线 |

**对 Java 开发者的类比**：Node 有点像 Spring Bean，但不是通过容器查找，而是通过树形路径访问；同时它自带生命周期方法，不需要 `@PostConstruct`/`@PreDestroy` 注解，而是重写 `_ready()` / `_exit_tree()`。

## Scene 是什么

**Scene（场景）** 是一棵 Node 树的定义，保存在 `.tscn` 文件里。你可以把 Scene 理解成一个**模板**或**类定义**——运行时可以实例化多次。

举例：

```
TrainingField.tscn（整个游戏场景）
├── FieldArt（Node2D，场地美术）
├── Ball（BallController，球）
├── PitcherSpot（Marker2D，投手位置）
├── HomeBase（Marker2D，本垒）
├── Defense（Node2D，守备员父节点）
│   ├── Eagle（AnimalController）
│   ├── Monkey（AnimalController）
│   └── Croc（AnimalController）
├── Offense（Node2D，进攻方）
│   └── BatterRunner（CharacterBody2D）
├── UI
│   ├── HUDLabel（Label）
│   └── DebugLabel（Label）
└── GameDirector（游戏总控脚本）
```

**对 Java 开发者的类比**：Scene 类似 Spring 的 `@Configuration` 类或 XML bean 定义——描述了哪些对象存在、如何组合，运行时才真正实例化。

## Script 与 Node 的关系

一个 Node 可以附加一个 GDScript 脚本，脚本里定义这个节点的行为。这和 Java 里"类定义对象行为"是一回事：

```gdscript
# ball_controller.gd
class_name BallController
extends Node2D        # 继承 Node2D，拥有 position 等属性

var height_z := 0.0   # 实例变量

func _ready() -> void:
    # 节点加入场景树时调用，类似 @PostConstruct
    _update_visuals()

func _physics_process(delta: float) -> void:
    # 每个物理帧调用
    match state:
        BallState.PITCHING: _tick_pitching(delta)
```

`extends Node2D` 就是继承，和 Java 的 `extends` 完全一样的概念。

## 场景树（Scene Tree）

运行时，所有场景里的节点组成一棵**场景树（Scene Tree）**。这棵树是全局唯一的，根节点是 Godot 引擎自动创建的。

```
Root（Godot 引擎）
└── TrainingField（你的主场景）
    ├── GameDirector
    ├── Ball
    └── ...
```

**对 Java 开发者的类比**：场景树类似于 Spring `ApplicationContext`，是对象图的运行时表示。但不同的是，你通过**路径**而不是类型来查找节点（类似 JNDI lookup，但更像文件路径）。

## 一个节点如何找到另一个节点

两种方式：

### 1. `$` 快捷语法（子节点）

```gdscript
$BallSprite          # 子节点 BallSprite
$"../Ball"           # 父节点下的兄弟节点 Ball（../是向上一级）
$"../UI/HUDLabel"    # 父节点下 UI 子节点里的 HUDLabel
```

### 2. `@onready`（延迟到 _ready 时解析）

```gdscript
@onready var ball: BallController = $"../Ball"
```

`@onready` 表示"在 `_ready()` 执行时再解析这个路径"，因为在 `_ready()` 之前场景树还没完全建立。

**对 Java 开发者的类比**：`@onready` 类似 `@Autowired`——声明依赖，框架帮你注入，只不过注入时机是场景就绪时而不是容器启动时。

## 三个核心概念的关系

```
Node     ← 对象实例（运行时存在）
  ↑
Scene    ← 节点树的模板（.tscn 文件）
  ↑
Script   ← 行为定义（.gd 文件，附加到节点）
```

- 一个 `.gd` 文件可以附加到多种节点
- 一个 `.tscn` 文件可以被实例化多次（运行时有多个 Node 实例）
- 不是每个 Node 都需要 Script（有些只是纯结构用途）

## 项目里的体现

Animal Baseball 的场景结构里：
- `AnimalController`（脚本）附加到多个守备员节点上——Eagle、Monkey、Croc 用同一个脚本，通过 `@export var animal_type: String` 区分行为
- `Marker2D` 节点（PitcherSpot、HomeBase、FirstBasePoint）没有任何脚本，只是位置标记
- `GameDirector` 脚本附加到一个空的 `Node` 上，作为纯逻辑控制器（不需要位置）

## 小结

| 概念 | Java 类比 | 关键特点 |
|------|-----------|----------|
| Node | Spring Bean | 有生命周期、有父子关系 |
| Scene | @Configuration / XML bean 定义 | 节点树的模板，可多次实例化 |
| Script | Java 类 | 附加到节点，定义行为 |
| Scene Tree | ApplicationContext | 运行时的全局对象图 |
| `$"../path"` | getBean() / JNDI | 按路径查找节点 |
| `@onready` | @Autowired | 声明式依赖，就绪时注入 |
