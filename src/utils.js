const weightReg = /^BR/
const tareCapitalLetter = 'T'
const zeroCapitalLetter = 'Z'
let debugFlag = true
const actionCode = {
	tare: 'BJ01',
	zero: 'BJ02'
}
const weightInfoType = {
	stable: {
		id: 'stable',
		typeReg: /^Wa/,
		valueReg: /^Wa(\-)?(\d*)B([a-zA-Z])B([a-zA-Z])/,
		normalizationValue (val) {
			const [instructStr, minus, weight, zero, tare] = val.match(this.valueReg)
			return {
				type: this.id,
				instructStr,
				weight: weightStr2Num(weight, minus),
				zero: zero === zeroCapitalLetter,
				tare: tare === tareCapitalLetter
			}
		}
	},
	unstable: {
		id: 'unstable',
		typeReg: /^Wn/,
		valueReg: /^Wn(\-)?(\d*)/,
		normalizationValue (val) {
			const [instructStr, minus, weight] = val.match(this.valueReg)
			return {
				type: this.id,
				instructStr,
				weight: weightStr2Num(weight, minus)
			}
		}
	},
	tare: {
		id: 'tare',
		typeReg: /^P/,
		valueReg: /^P(\-)?(\d*)/,
		normalizationValue (val) {
			const [instructStr, minus, weight] = val.match(this.valueReg)
			return {
				type: this.id,
				instructStr,
				weight: weightStr2Num(weight, minus)
			}
		}
	},
	OK: {
		id: 'OK',
		typeReg: /^OK$/,
		normalizationValue (val) {
			return {
				type: this.id
			}
		}
	},
	OkStable: {
		id: 'OkStable',
		typeReg: /^OKWa/,
		valueReg: /^OKWa(\-)?(\d*)B([a-zA-Z])B([a-zA-Z])/,
		normalizationValue (val) {
			const [instructStr, minus, weight, zero, tare] = val.match(this.valueReg)
			return {
				type: this.id,
				instructStr,
				weight: weightStr2Num(weight, minus),
				zero: zero === zeroCapitalLetter,
				tare: tare === tareCapitalLetter
			}
		}
	},
	OKTare: {
		id: 'OKTare',
		typeReg: /^OKP/,
		valueReg: /^OKP(\-)?(\d*)/,
		normalizationValue (val) {
			const [instructStr, minus, weight] = val.match(this.valueReg)
			return {
				type: this.id,
				instructStr,
				weight: weightStr2Num(weight, minus)
			}
		}
	}
}
const weightTypeTools = {
	is (type) {
		return (str) => {
			return weightInfoType[type].typeReg.test(str)
		}
	},
	normalizationValue (type) {
		return (val) => {
			return weightInfoType[type].normalizationValue(val)
		}
	}
}
const successToast = function (title) {
	wx.showToast({
		title,
		icon: 'success',
		duration: 2000
	})
}
const errorToast = function (title) {
	wx.showToast({
		title,
		icon: 'error',
		duration: 2000
	})
}

const ab2Ascii = function (buffer) {
	const hexArr = Array.prototype.map.call(
		new Uint8Array(buffer),
		function (bit) {
			return String.fromCharCode(bit)
		}
	)
	return hexArr.join('')
}

const weightStr2Num = function (weight, minus) {
	if (!weight) {
		return 0
	}
	weight = weight.split('').reverse()
	weight.splice(3, 0, '.')
	weight = weight.join('')
	if (minus) {
		weight = `-${weight}`
	}
	return isNaN(Number(weight)) ? 0 : Number(weight)
}

const str2buffer = function (str) {
	const buffer = new ArrayBuffer(str.length)
	const dataView = new DataView(buffer)
	const strs = [...str]
	strs.forEach((item, index) => {
		dataView.setUint8(index, item.charCodeAt())
	})
	return buffer
}

const debug = function () {
	if (debugFlag) {
		console.log(...arguments)
	}
}

const setDebugFlag = function (flag) {
	debugFlag = flag
}

const setDeviceCache = function (deviceId, deviceName) {
	wx.setStorageSync('fx-device', `${deviceId}$$${deviceName}`)
}

const getDeviceCache = function () {
	const device = wx.getStorageSync('fx-device')
	if (device) {
		const [deviceId, deviceName] = device.split('$$')
		return {
			deviceId,
			deviceName
		}
	} else {
		return {}
	}
}

const noop = () => {}

module.exports = {
	weightTypeTools,
	weightReg,
	errorToast,
	successToast,
	ab2Ascii,
	weightStr2Num,
	tareBuffer: str2buffer(actionCode.tare),
	zeroBuffer: str2buffer(actionCode.zero),
	debug,
	setDebugFlag,
	setDeviceCache,
	getDeviceCache,
	noop
}
