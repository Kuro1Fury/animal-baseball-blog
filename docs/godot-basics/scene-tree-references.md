# 场景树与节点引用：$、@onready、get_node()

> 在 Godot 里，脚本之间不直接互相 import——而是通过场景树的路径找到彼此。

## 场景树是什么

运行时，所有节点以树形结构组织，根节点是 Godot 引擎创建的 `Root`：

```
Root
└── TrainingField          ← 主场景根节点
    ├── GameDirector       ← 脚本挂在这个 Node 上
    ├── Ball               ← BallController 脚本
    ├── Defense            ← 守备员的父节点（空 Node）
    │   ├── Eagle
    │   ├── Monkey
    │   └── Croc
    └── UI
        ├── HUDLabel
        └── DebugLabel
```

脚本里引用其他节点，本质上是在这棵树里"按路径导航"。

## 三种引用方式

### 1. `$` 快捷语法

最常用的方式，等同于 `get_node()`：

```gdscript
$BallSprite              # 直接子节点 BallSprite
$"../Ball"               # 父节点的兄弟节点 Ball（../ 向上一级）
$"../UI/HUDLabel"        # 父节点 → UI → HUDLabel（多级路径）
```

**规则**：
- 不加引号：路径里不含空格或特殊字符时可省略引号
- 加引号：路径含 `../` 或空格时必须加引号

### 2. `@onready` — 推荐做法

把 `$` 路径绑定到成员变量，在 `_ready()` 时自动解析：

```gdscript
# game_director.gd
@onready var ball:         BallController = $"../Ball"
@onready var pitcher_spot: Marker2D       = $"../PitcherSpot"
@onready var result_label: Label          = $"../UI/ResultLabel"
```

好处：
- 只解析一次，之后用变量名访问，比每次都写 `$"..."` 更清晰
- 带类型注解（`: BallController`）让 IDE 知道类型，可以补全
- 比 `_ready()` 里手动赋值更简洁

**对 Java 开发者的类比**：

```java
// Java @Autowired
@Autowired
private BallController ball;

// GDScript @onready
@onready var ball: BallController = $"../Ball"
```

两者都是"声明我需要这个依赖，框架（引擎）帮我注入"。区别在于 Spring 按类型查找，Godot 按路径查找。

### 3. `get_node()` — 动态查找

运行时按路径查找，适合路径不固定的情况：

```gdscript
var label = get_node("../UI/ResultLabel") as Label
var child = get_node("Defense/" + animal_name)
```

动态路径时才用这个，静态路径优先用 `@onready`。

## 路径规则

| 写法 | 含义 |
|------|------|
| `$"Child"` | 直接子节点 |
| `$"Child/Grandchild"` | 子节点的子节点 |
| `$"../Sibling"` | 父节点的另一个子节点（兄弟节点）|
| `$"../../Uncle"` | 祖父节点的子节点 |
| `/root/NodeName` | 从场景树根部绝对路径 |

**类比文件系统**：和 Unix 路径完全一样的逻辑，`..` 向上一级。

## 为什么 GameDirector 里都是 `$"../..."`？

GameDirector 是 `TrainingField` 的直接子节点，所以它的"兄弟节点"（Ball、Defense 等）都在 `../` 路径下：

```
TrainingField
├── GameDirector   ← 脚本在这里，这是"自己"
├── Ball           ← $"../Ball"（父节点下的 Ball）
├── Defense        ← $"../Defense"
└── UI
    └── HUDLabel   ← $"../UI/HUDLabel"
```

## 全局坐标 vs 局部坐标

节点有两套坐标：

```gdscript
node.position        # 相对于父节点的局部坐标
node.global_position # 相对于场景根的全局坐标
```

当你在不同层级的节点之间比较位置时，必须都转换到同一套坐标系：

```gdscript
# 错误：一个是局部坐标，一个是全局坐标，无法比较
animal.position.distance_to(ball.global_position)

# 正确：都用全局坐标
animal.global_position.distance_to(ball.global_position)
```

坐标系转换：

```gdscript
# 把全局坐标转换成相对于 _tf 节点的局部坐标
var local_pos = _tf.to_local(target.global_position)

# 把局部坐标转换成全局坐标
var global_pos = _tf.to_global(local_pos)
```

项目里 `GameDirector` 经常需要把 `global_position` 转成相对于场景根的局部坐标，传给 `BallController`（因为 Ball 节点在场景根下，它的局部坐标就是全局坐标）。

## 遍历子节点

```gdscript
# 遍历 Defense 下所有子节点（所有守备员）
for animal in _defense_node.get_children():
    var atype := animal.animal_type as String
    # ...

# 项目里的实际代码（game_director.gd）
for animal in _defense_node.get_children():
    animal.reset_to_initial()
```

`get_children()` 返回直接子节点数组，等同于 Java 里遍历一个集合。

## 注意事项

**不要在 `_init()` 里访问 `$`**：此时场景树还未建立，会抛错。

**路径区分大小写**：`$"ballsprite"` 和 `$"BallSprite"` 是不同路径。

**节点名变了路径就失效**：如果在编辑器里改了节点名，所有引用这个节点的路径字符串都要手动更新。这是 Godot 比 Spring 依赖注入更"脆"的地方。

## 在项目里找这些内容

- `game_director.gd`:9-19 — 大量 `@onready` 声明（最典型的示例）
- `animal_controller.gd`:19 — `$Body.color` 直接访问子节点
- `game_director.gd`:459-461 — `get_children()` 遍历守备员
- `game_director.gd`:631 — `to_local()` 坐标转换
