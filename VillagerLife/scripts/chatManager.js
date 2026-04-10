import { system } from "@minecraft/server";

const activeTimeouts = new Map(); 
const dialogueQueues = new Map(); // 주민별 대화 큐 [ { message, duration, priority } ]

/**
 * 대화 큐에 메시지를 추가합니다.
 * priority: 높을수록 먼저 출력 (예: 보안=10, 일상=1)
 */
export function addDialogue(villager, message, duration = 60, priority = 1) {
    if (!villager?.isValid()) return;
    const id = villager.id;

    if (!dialogueQueues.has(id)) dialogueQueues.set(id, []);
    
    const queue = dialogueQueues.get(id);
    queue.push({ message, duration, priority });
    
    // 우선순위 높은 순으로 정렬
    queue.sort((a, b) => b.priority - a.priority);
    
    // 현재 아무 말도 안 하고 있다면 즉시 첫 번째 대사 출력 시도
    if (!activeTimeouts.has(id)) {
        processNextDialogue(villager);
    }
}

function processNextDialogue(villager) {
    if (!villager?.isValid()) return;
    const id = villager.id;
    const queue = dialogueQueues.get(id);

    if (!queue || queue.length === 0) return;

    const { message, duration } = queue.shift();
    villager.nameTag = `§e${message}§r`;

    const timeoutId = system.runTimeout(() => {
        if (villager.isValid()) villager.nameTag = "";
        activeTimeouts.delete(id);
        
        // 다음 대사가 있다면 0.5초(10틱) 뒤에 출력 (연속 대사 자연스럽게)
        system.runTimeout(() => processNextDialogue(villager), 10);
    }, duration);

    activeTimeouts.set(id, timeoutId);
}

export function isVillagerTalking(villagerId) {
    return activeTimeouts.has(villagerId);
}

// 주민 제거 시 큐 정리
export function clearDialogueQueue(villagerId) {
    dialogueQueues.delete(villagerId);
    activeTimeouts.delete(villagerId);
}