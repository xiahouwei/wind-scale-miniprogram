# wind-scale-miniprogram

一个用于微信小程序的电子秤核心包

#### 1.安装
```
// 1. 在小程序开发工具

npm install wind-scale-miniprogram --save

// 2. 小程序开发工具选择 [工具] -> [构建npm]

```

不错的教程👇🏻👇🏻👇🏻

[微信小程序如何引入npm包？](https://developers.weixin.qq.com/community/develop/article/doc/0008aecec4c9601e750be048d51c13)


#### 2.使用

```javascript
// $fxWeight为蓝牙电子秤实例
import { $fxWeight } from 'wind-scale-miniprogram'
```

#### 2.1 蓝牙电子秤初始化 --- init

```javascript
// 失败会自动提示蓝牙未开启
$fxWeight.init().then(res => {
    // 蓝牙开启成功
})

```

#### 2.2 静默连接 --- silentConnect

```javascript
// 会自动连接上次连接的电子秤
$fxWeight.silentConnect()

```

#### 2.3 扫描电子秤 --- scanWeight

```javascript
// 扫描电子秤, 每当扫描到新的电子秤信息会触发findWeightFn内的回调
$fxWeight.scanWeight().then(({ devicesList, findWeightFn }) => {
    this.setData({
        deviceList: devicesList,
        searchState: true,
        connectDeviceId: ''
    })
    findWeightFn(devices => {
        this.setData({
            deviceList: devices
        })
    })
})

```

#### 2.4 停止扫描电子秤 --- stopScanWeight

```javascript
$fxWeight.stopScanWeight().then(() => {
    this.setData({
        searchState: false
    })
})

```

#### 2.5 连接电子秤, 以及订阅秤的信息 --- connectionWeight && notifyWeight

```javascript
$fxWeight.connectionWeight(deviceId, name).then(() => {
	$fxWeight.notifyWeight(value => {
		// type 称重类型
		// weight 重量
		// tare 去皮标记
		// zero 置零标记
		switch (value.type) {
		// 稳定称重
		case 'stable':
			this.setData({
				weight: value.weight,
				tareFlag: value.tare,
				zeroFlag: value.zero
			})
			break
		// 不稳定称重
		case 'unstable':
			this.setData({
				weight: value.weight
			})
			break
		// 去皮
		case 'tare':
			this.setData({
				tareWeight: value.weight
			})
			break
		// 置零
		case 'OkStable':
			this.setData({
				weight: value.weight,
				tareFlag: value.tare,
				zeroFlag: value.zero,
				tareWeight: 0
			})
			console.log('设置置零成功')
			break
		// 去皮
		case 'OKTare':
			this.setData({
				tareWeight: value.weight
			})
			console.log('设置去皮成功')
			break
		case 'OK':
			console.log('设置成功')
			this.setData({
				tareWeight: 0
			})
			break
		}
	})
}).catch(() => {
    this.setData({
        connectDeviceId: ''
    })
})

```


#### 2.6 断开电子称的连接 --- closeWeight

```javascript
$fxWeight.closeWeight(deviceId).then(() => {
    // .....
})

```

#### 2.7 获取电子秤连接状态 --- getDeviceConnect

```javascript
$fxWeight.getDeviceConnect()

```

#### 2.8 获取已经扫描过的设备列表

```javascript
$fxWeight.getDevicesList()

```

#### 2.9 获取电子秤扫描状态

```javascript
$fxWeight.getScanState()

```

#### 2.10 发送去皮指令

```javascript
$fxWeight.sendTareCode().then(res => {
})

```

#### 2.11 发送置零指令

```javascript
$fxWeight.sendZeroCode().then(res => {
})

```

#### 2.12 订阅电子秤连接状态变更信息

```javascript
$fxWeight.notifyWeightConnectStateChange(this, res => {
    // res.connected [boolean] 连接状态
    // res.deviceId [string] 设备id
    // res.deviceName [string] 设备名称
})

```

#### 2.13 开启调试

```javascript
$fxWeight.openDebug()

```