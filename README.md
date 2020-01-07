# vue-route-webpack-plugin

### 介绍

扫描项目中`vue`文件的路由配置并生成路由文件的一款 webpack 插件。

### 特性

使用插件后，只需在项目的`.vue`文件中加上这样的路由配置：
```js
// 例如在 src/views/user/list.vue 文件中：

/**
 * 在会员列表文件中，声明该页面，对应的路由信息。
 * 支持一个页面有多个路由。
 * 
 * 简单配置：
 * 第二个参数将作为 alias
 * @route("user/list/:type")
 * @route("user/list", "user")
 * 
 * 如果需要额外的路由配置，可以使用对象形式的配置方式：
 * @route({
 *   path: "user/list",
 *   name: "user-list",
 *   alias: "user",
 *   // 注意：这里 meta 字段的值只支持一层对象
 *   meta: { 
 *     requiresAuth: true,
 *     userType: "member",
 *   }
 * })
 */
```

当启动开发服务或执行构建时，插件就会根据这个配置默认生成如下内容的名为`children.js`的路由文件：
```js
// 生成的路由文件默认会放在：src/router/children.js，你可以使用选项来修改默认值
import userlist from "../views/user/list.vue";

export default [
  {
    path: "user/list/:type",
    component: userlist,
  },
  {
    path: "user/list",
    alias: "user",
    component: userlist,
  },
  {
    path: "user/list",
    alias: "user",
    name: "user-list",
    component: userlist,
    meta: { 
      requiresAuth: true,
      userType: "member",
    }
  },
]
```

就是这么简单，你无需再关心该从哪个目录`import`文件，更无需再写编写这些浪费时间的路由配置项。

### 使用方式

#### 快速尝试
在仓库中有一个 `example` 目录，你可以将本项目克隆到本地后，进入到该目录下，执行：
```
$ yarn install
// 然后执行
$ yarn start 
// 或 
$ yarn build
```

执行完上述命令后，你就可以在`src/router/`目录下看到自动生成的路由文件了。
你可以自行修改`views`目录中的文件查看编译后的路由改动结果。

#### 安装
```bash
$ yarn add -D @xiyun/vue-route-webpack-plugin
```

#### 配置
在`vue.config.js`或在`webpack`配置文件中加入插件配置：
```js
const VueRouteWebpackPlugin = require("@xiyun/vue-route-webpack-plugin");

module.exports = {
  configureWebpack: {
    plugins: [
      new VueRouteWebpackPlugin({
        // 选项，见下文
      })
    ],
  }
};
```

#### 使用
在需要配置路由的页面级`.vue`文件中加入路由配置：

`假设在 user.vue 文件中：`
```html
<template>
  <div>user</div>
</template>
<script>
/**
 * 
 * 简单配置：
 * 第二个参数将作为 alias
 * @route("user/list/:type")
 * @route("user/list", "user")
 * 
 * 如果需要额外的路由配置，可以使用对象形式的配置方式：
 * @route({
 *   path: "user/list",
 *   name: "user-list",
 *   alias: "user",
 *   // 注意：这里 meta 字段的值只支持一层对象
 *   meta: { 
 *     requiresAuth: true,
 *     userType: "member",
 *   }
 * })
 */
// 单行注释也是可以的
// @route("user/list/:type")
export default {
  name: "user",
  data() {
    return {}
  }
}
</script>
```

**默认情况下**，当你启动开发服务或执行构建的时候，就会在`src/router`目录下生成`children.js`这个路由文件。

假设你的页面文件路径是：`src/views/user/list.vue`，那么生成的路由文件的内容看起来就会是这样的：
```js
import userlist from "../views/user/list.vue";

export default [
  {
    path: "user/list/:type",
    component: userlist,
  },
  {
    path: "user/list",
    alias: "user",
    component: userlist,
  },
  {
    path: "user/list",
    alias: "user",
    name: "user-list",
    component: userlist,
    meta: { 
      requiresAuth: true,
      userType: "member",
    }
  },
]
```

*因为这个路由文件是由插件自动生成的，所以你可以在 .gitignore 文件中把它在版本库中忽略掉，避免多人协同开发时**因频繁改动发生冲突**。*

**如果使用了 eslint，同时忽略了路由文件，那么需要在 `.eslintrs.js` 中禁用掉这两个检查规则：**
```js
"import/no-unresolved": "off",
"import/extensions": "off",
```

#### 默认目录约定

```
src/
  |-views/         (项目文件，插件会扫描该目录下所有 .vue 文件的路由配置)
    |-...
  |-router/        (路由目录)
    |-index.js     (主路由文件，需要引入 children.js 作为子路由来使用)
    |-children.js  (路由文件，由插件自动生成)
```

#### 选项参考

插件提供了以下这些选项供自定义配置
```js
new VueRouteWebpackPlugin({
  // 配置 import 路径前缀，默认是："../"，因为路由文件会默认放在 src/router/ 目录下
  prefix: "../",
  // 插件扫描的项目目录，默认会扫描 "src/views" 目录
  directory: "src/views",
  // 生成的路由文件存放地址，默认存放到 "src/router/children.js"
  routeFilePath: "src/router/children.js",
  // 生成的文件中的 import 路径是否使用双引号规范，默认使用
  // 注意：生成的路由文件中的 path 的引号是原封不动使用用户的
  doubleQoute: true,
})
```
