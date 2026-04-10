import { system } from "@minecraft/server";

const activeTimeouts = new Map(); 
const dialogueQueues = new Map();

export function addDialogue(villager, message, duration = 60, priority = 1) {
    if (!villager?.isValid()) return;
    const id = villager.id;

    if (!dialogueQueues.has(id)) dialogueQueues.set(id, []);
    const queue = dialogueQueues.get(id);
    queue.push({ message, duration, priority });
    queue.sort((a, b) => b.priority - a.priority);
    
    if (!activeTimeouts.has(id)) {
        processNextDialogue(villager);
    }
}

function processNextDialogue(villager) {
    if (!villager?.isValid()) {
        clearDialogueQueue(villager?.id);
        return;
    }
    const id = villager.id;
    const queue = dialogueQueues.get(id);

    if (!queue || queue.length === 0) return;

    const { message, duration } = queue.shift();
    villager.nameTag = `§e${message}§r`;

    const timeoutId = system.runTimeout(() => {
        if (villager.isValid()) villager.nameTag = "";
        activeTimeouts.delete(id);
        system.runTimeout(() => processNextDialogue(villager), 10);
    }, duration);

    activeTimeouts.set(id, timeoutId);
}

export function isVillagerTalking(villagerId) {
    return activeTimeouts.has(villagerId);
}

export function clearDialogueQueue(villagerId) {
    if (!villagerId) return;
    dialogueQueues.delete(villagerId);
    activeTimeouts.delete(villagerId);
}