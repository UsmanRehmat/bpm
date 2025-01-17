import { CommandError } from "@usmanrehmat/core";

export enum TaskType {
    UserTask = 'UserTask',
    ServiceTask = 'ServiceTask'
}

export class BusinessProcess {
    currentTasks: string[] = [];
    completedTasks: string[] = [];

    constructor(
        readonly inititalTasks: string[],
        readonly definedTasks: BusinessTask[]
    ) { }

    start() {
        this.currentTasks = [...this.inititalTasks];
    }

    canComplete(taskName: string) {
        // ensure task is currently active
        if (!this.currentTasks.includes(taskName)) return false;
        
        // get business task
        const foundBusinessTask = this.definedTasks.find(t => t.taskName === taskName);
        if (!foundBusinessTask) return true
        
        // check task constraint
        try {
            const ok = foundBusinessTask.canComplete(this);
            return ok;
        } catch (err) {
            return false;
        }
    }

    resolve(taskName: string) {
        try { 
            this.complete(taskName);
            return true;
        } catch (err) { 
            return false 
        };
    }
    
    complete(taskName: string) {
        // ensure task is currently active
        if (!this.currentTasks.includes(taskName))
            throw new CommandError(`Task "${taskName}" not in current active tasks of the process`, 'TASK_NOT_ACTIVE');
        
        // get business task
        const foundBusinessTask = this.definedTasks.find(t => t.taskName === taskName);
        if (!foundBusinessTask) {
            // throw new CommandError(`Task "${taskName}" not available in process`, 'TASK_NOT_AVAILABLE');
            this.currentTasks = this.currentTasks.filter(t => t != taskName);
            this.completedTasks.push(taskName);
            return;
        }
        
        // check task constraint
        const ok = foundBusinessTask.canComplete(this);
        if (!ok) throw new CommandError(`Task "${taskName}" transition contraint failed`, 'TASK_CONSTRAINT_FAILED');
        
        // update process
        this.currentTasks.push(...foundBusinessTask.getNextTasks(this));
        this.currentTasks = this.currentTasks.filter(t => t != taskName);
        this.completedTasks.push(taskName);
    }

    load(process: BusinessProcess) {
        this.currentTasks = process.currentTasks;
        this.completedTasks = process.completedTasks;
    }
}

export type NextTasksFunc = (process: BusinessProcess) => string[];
export type TaskConstraintFunc = (process: BusinessProcess) => boolean;

export class BusinessTask {
    constructor(
        readonly taskName: string,
        readonly taskType: TaskType,
        readonly getNextTasks: NextTasksFunc = () => [],
        readonly canComplete: TaskConstraintFunc = () => true,
    ) { }
}