# vue-route-webpack-plugin

### 介绍

扫描文件中的路由配置，生成路由文件的 webpack 插件

### 使用方式

#### 安装
```bash
$ yarn add -D @xiyun/vue-route-webpack-plugin
```

#### 配置
在`vue.config.js`中：
```js
const vueRouteWebpackPlugin = require('@xiyun/vue-route-webpack-plugin');

module.exports = {
  configureWebpack: {
    plugins: [
      new vueRouteWebpackPlugin()
    ],
  }
};
```

#### 使用
在需要配置路由的页面级`.vue`文件中加入如下注释：
```js
// @route('user/list')
// 或
// 第二个参数是路由别名
// @route('user/list', 'user')

// 或使用多行注释
/**
 * @route('user/list')
 * 或
 * @route('user/list', 'user')
 */
```

当你启动开发服务或执行构建的时候，就会在`src/router`目录下生成`children.js`这个路由文件。

假设你的页面文件路径是：`src/views/user/list.vue`，那么生成的路由文件的内容看起来就会是这样的：
```js
import userlist from '@/views/user/list.vue';

export default [
  {
    path: 'user/list',
    name: 'userlist',
    component: userlist,
    // 如果配置了别名
    alias: 'user',
  },
]
```

#### 目录约定

```
src/
  |-views/         (项目文件，插件会扫描该目录下所有 .vue 文件的路由配置)
  |-router/        (路由目录)
    |-index.js     (主路由文件，需要引入 children.js 作为子路由来使用)
    |-children.js  (路由文件，由插件自动生成)
```
