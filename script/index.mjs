import { execa } from 'execa'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
function resolve (dir) {
	return path.join(__dirname, dir)
}

const filterFunc = src => {
	return !/node_modules$|.git$|package-lock.json$|.DS_Store$/.test(src)
}
const targeCwd = '/Users/shanghuawei/01_work/02_工作项目/00_风行核心依赖/01_wind-scale-miniprogram'
const args = ['install', '--loglevel', 'error']

try {
	fs.copySync(resolve('../'), targeCwd, { filter: filterFunc })
	await execa('npm', args, {
		cwd: targeCwd,
		stdio: ['inherit', 'inherit', 'inherit']
	})
	await execa('git', ['add', '.'], {
		cwd: targeCwd,
		stdio: ['inherit', 'inherit', 'inherit']
	})
	await execa('git', ['commit', '-m', 'task:upload'], {
		cwd: targeCwd,
		stdio: ['inherit', 'inherit', 'inherit']
	})
	await execa('git', ['push'], {
		cwd: targeCwd,
		stdio: ['inherit', 'inherit', 'inherit']
	})
	console.log('upload2git success!')
} catch (err) {
	console.error(err)
}

