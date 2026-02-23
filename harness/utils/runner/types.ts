export type BaseTaskDef = Readonly<{
	allowFailure?: boolean
	id: string
	name?: string
	timeoutMs?: number
}>

export type TaskDef = BaseTaskDef &
	Readonly<{
		command: string
	}>

export type TaskRunnerConfig = Readonly<{
	tasks: TaskDef[]
}>

export type TaskResult = Readonly<{
	durationMs: number
	id: string
	ok: boolean
}>

export type RunTasksOptions = Readonly<{
	configPath?: string
	cwd?: string
}>
