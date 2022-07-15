import { $fxCreateEventBus } from 'wind-eventbus-miniprogram'
const {
	weightTypeTools,
	weightReg,
	errorToast,
	ab2Ascii,
	tareBuffer,
	zeroBuffer,
	debug,
	setDebugFlag,
	setDeviceCache,
	getDeviceCache,
	noop
} = require('./utils')

const $fxScaleEventBus = $fxCreateEventBus()
class WeightApi {
	constructor () {
		this.ready = null
		this.scanDeviceState = false
		this.devicesList = []
		this.deviceName = ''
		this.deviceId = ''
		this.serviceId = ''
		this.writeCharacteristicId = ''
		this.notifyCharacteristicId = ''
		this.onBluetoothDeviceFoundCallBack = noop
	}

	// 开启蓝牙模块
	init () {
		return new Promise(resolve => {
			debug('开启蓝牙模块')
			this.onBLEConnectionStateChange()
			if (this.ready) {
				resolve(this.ready)
			} else {
				wx.openBluetoothAdapter({
					success: (res) => {
						debug('开启蓝牙模块-成功', res)
						this.ready = res
						resolve(res)
					},
					fail (error) {
						console.log(error)
						errorToast('蓝牙未开启!')
					}
				})
			}
		})
	}

	// 静默连接
	silentConnect = () => {
		const { deviceId, deviceName } = getDeviceCache()
		if (deviceId) {
			this.connectionWeight(deviceId, deviceName, false).then(() => {
				$fxScaleEventBus.emit('weightConnect', {
					deviceId,
					deviceName,
					connected: true
				})
			})
		}
	}

	// 扫描电子秤
	scanWeight () {
		return new Promise(resolve => {
			this.startBluetoothDevicesDiscovery().then(() => {
				this.devicesList = this.deviceId
					? [{
						deviceId: this.deviceId,
						name: this.deviceName
					}]
					: []
				resolve({
					devicesList: this.devicesList,
					findWeightFn: this.onBluetoothDeviceFound
				})
			})
		})
	}

	// 搜索蓝牙设备
	startBluetoothDevicesDiscovery = () => {
		return new Promise(resolve => {
			this.stopScanWeight().then(() => {
				debug('搜索蓝牙设备')
				if (this.scanDeviceState) {
					resolve()
				} else {
					wx.startBluetoothDevicesDiscovery({
						allowDuplicatesKey: true,
						success: (res) => {
							debug('搜索蓝牙设备-成功', res)
							this.scanDeviceState = true
							resolve()
						},
						fail (error) {
							console.log(error)
							errorToast('搜索电子秤失败!')
						}
					})
				}
			})
		})
	}

	// 监听添加蓝牙设备
	onBluetoothDeviceFound = (fn) => {
		this.onBluetoothDeviceFoundCallBack = (res) => {
			let devices = this.getScales(res.devices)
			if (devices.length > 0) {
				devices = devices.filter(item => !~this.devicesList.findIndex(device => device.deviceId === item.deviceId))
				if (devices.length > 0) {
					this.devicesList = this.devicesList.concat(devices)
					fn(this.devicesList)
				}
			}
		}
		wx.onBluetoothDeviceFound(this.onBluetoothDeviceFoundCallBack)
	}

	// 取消监听添加蓝牙设备
	onOffBluetoothDeviceFound = () => {
		wx.offBluetoothDeviceFound(this.onBluetoothDeviceFoundCallBack)
	}

	// 过滤秤设备
	getScales (devices) {
		return devices.filter(item => weightReg.test(item.name))
	}

	// 停止扫描秤设备
	stopScanWeight () {
		return new Promise(resolve => {
			if (!this.scanDeviceState) {
				resolve()
			} else {
				wx.stopBluetoothDevicesDiscovery({
					success: (res) => {
						debug('停止搜索蓝牙设备')
						this.onOffBluetoothDeviceFound()
						this.scanDeviceState = false
						resolve()
					}
				})
			}
		})
	}

	// 连接电子秤
	connectionWeight (deviceId, deviceName, silent = false) {
		return this.connectionWeightHandler(silent)(deviceId, deviceName)
			.then(this.createWeightService(silent))
			.then(this.getWeightCharacteristics(silent))
	}

	connectionWeightHandler = (silent) => {
		return (deviceId, deviceName) => {
			return new Promise((resolve, reject) => {
				debug('电子秤建立连接', deviceId)
				wx.createBLEConnection({
					deviceId,
					success: (res) => {
						debug('电子秤建立连接-成功', res)
						this.deviceId = deviceId
						this.deviceName = deviceName
						setDeviceCache(deviceId, deviceName)
						resolve()
					},
					fail (error) {
						if (!silent) {
							errorToast('无法连接!')
						}
						reject(error)
					}
				})
			})
		}
	}

	// 电子秤建立服务
	createWeightService = (silent) => {
		return () => {
			return new Promise((resolve, reject) => {
				debug('电子秤建立服务连接', this.deviceId)
				wx.getBLEDeviceServices({
					deviceId: this.deviceId,
					success: (res) => {
						debug('电子秤建立服务连接-成功')
						debug('device services:', res.services)
						const serviceId = res.services[0].uuid
						this.serviceId = serviceId
						resolve(serviceId)
					},
					fail (error) {
						if (!silent) {
							errorToast('无法建立服务!')
						}
						reject(error)
					}
				})
			})
		}
	}

	// 获取电子秤服务描述
	getWeightCharacteristics = (silent) => {
		return () => {
			return new Promise((resolve, reject) => {
				debug('获取电子秤服务描述')
				wx.getBLEDeviceCharacteristics({
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					success: (res) => {
						debug('获取电子秤服务描述-成功')
						debug('device getBLEDeviceCharacteristics:', res.characteristics)
						const notifyCharacteristic = res.characteristics.find(item => !!item.properties.notify)
						const writeCharacteristic = res.characteristics.find(item => !!item.properties.write)
						if (!notifyCharacteristic || !writeCharacteristic) {
							errorToast('无法连接服务!')
						} else {
							this.notifyCharacteristicId = notifyCharacteristic.uuid
							this.writeCharacteristicId = writeCharacteristic.uuid
							resolve()
						}
					},
					fail (error) {
						if (!silent) {
							errorToast('无法连接服务!')
						}
						reject(error)
					}
				})
			})
		}
	}

	// 订阅电子秤称重信息
	notifyWeight = (fn) => {
		debug('订阅通知')
		wx.notifyBLECharacteristicValueChange({
			state: true,
			deviceId: this.deviceId,
			serviceId: this.serviceId,
			characteristicId: this.notifyCharacteristicId,
			success: (res) => {
				debug('订阅通知成功')
				debug('notifyBLECharacteristicValueChange success', res)
				wx.onBLECharacteristicValueChange((res) => {
					if (res.value) {
						// debug('收到称重信息', res)
						const weightInfo = this.normalizationWeightInfo(ab2Ascii(res.value))
						if (weightInfo) {
							fn({
								id: res.characteristicId,
								...weightInfo
							})
						}
					}
				})
			},
			fail (error) {
				console.log(error)
				errorToast('无法订阅服务!')
			}
		})
	}

	// 转换称重信息
	normalizationWeightInfo (str) {
		debug(str)
		if (weightTypeTools.is('stable')(str)) {
			return weightTypeTools.normalizationValue('stable')(str)
		} else if (weightTypeTools.is('unstable')(str)) {
			return weightTypeTools.normalizationValue('unstable')(str)
		} else if (weightTypeTools.is('tare')(str)) {
			return weightTypeTools.normalizationValue('tare')(str)
		} else if (weightTypeTools.is('OK')(str)) {
			return weightTypeTools.normalizationValue('OK')(str)
		} else if (weightTypeTools.is('OkStable')(str)) {
			return weightTypeTools.normalizationValue('OkStable')(str)
		} else if (weightTypeTools.is('OKTare')(str)) {
			return weightTypeTools.normalizationValue('OKTare')(str)
		} else {
			console.log('接收到无法处理的数据')
		}
	}

	// 发送去皮指令
	sendTareCode () {
		return new Promise(resolve => {
			if (!this.writeCharacteristicId) {
				errorToast('设置去皮失败!')
			} else {
				debug('设置去皮指令')
				wx.writeBLECharacteristicValue({
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: this.writeCharacteristicId,
					value: tareBuffer,
					success (res) {
						debug('发送去皮指令成功', res)
						resolve()
					},
					fail (error) {
						console.log(error)
						errorToast('设置去皮失败!')
					}
				})
			}
		})
	}

	// 发送置零指令
	sendZeroCode () {
		return new Promise(resolve => {
			if (!this.writeCharacteristicId) {
				errorToast('设置置零失败!')
			} else {
				debug('设置置零指令')
				wx.writeBLECharacteristicValue({
					deviceId: this.deviceId,
					serviceId: this.serviceId,
					characteristicId: this.writeCharacteristicId,
					value: zeroBuffer,
					success (res) {
						debug('发送置零指令成功', res)
						resolve()
					},
					fail (error) {
						console.log(error)
						errorToast('设置置零失败!')
					}
				})
			}
		})
	}

	// 获取电子秤扫描状态
	getScanState () {
		return this.scanDeviceState
	}

	// 获取已经扫描过的设备列表
	getDevicesList () {
		return this.devicesList
	}

	// 获取电子秤连接状态
	getDeviceConnect () {
		return {
			deviceName: this.deviceName,
			deviceId: this.deviceId
		}
	}

	// 监听电子秤连接状态
	onBLEConnectionStateChange = () => {
		wx.onBLEConnectionStateChange((res) => {
			if (res.deviceId === this.deviceId && !res.connected) {
				this.deviceName = ''
				this.deviceId = ''
				$fxScaleEventBus.emit('weightConnect', {
					connected: false
				})
			}
		})
	}

	// 断开电子称的连接
	closeWeight = (deviceId) => {
		return new Promise(resolve => {
			wx.closeBLEConnection({
				deviceId,
				success (res) {
					resolve(res)
				}
			})
		})
	}

	// 订阅电子秤连接状态变更信息
	notifyWeightConnectStateChange = (context, fn) => {
		$fxScaleEventBus.on('weightConnect', context, fn)
	}

	// 开启调试
	openDebug () {
		setDebugFlag(true)
	}
}
module.exports = {
	$fxWeight: new WeightApi()
}
