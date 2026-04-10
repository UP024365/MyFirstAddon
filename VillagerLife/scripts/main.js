import { world, system } from "@minecraft/server";

// 임포트 시작 로그
world.sendMessage("§e[시스템] 통합 로그 및 대화 큐 시스템 임포트를 시작합니다...§r");

import { addDialogue, isVillagerTalking, clearDialogueQueue } from "./chatManager.js";
import { handleRoutineDialogue } from "./scheduleManager.js";
import { 
    updateHunger, 
    removeVillagerData, 
    pickupFoodOnGround, 
    eatFromInventory 
} from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { handleWeatherDialogue } from "./weatherManager.js";
import { openVillagerMenu } from "./uiManager.js";

// --- [신규] 통합 로그 함수 ---
/**
 * 주민의 아이디와 현재 실행 중인 우선순위/행동을 채팅창에 출력합니다.
 */
function logAction(villager, priority, action) {
    const vId = villager.id.slice(-4);
    world.sendMessage(`§7[LOG][P${priority}] 주민(${vId}): ${action}§r`);
}

// 모든 임포트 완료 후 실행
system.run(() => {
    world.sendMessage("§a[시스템] VillagerLife 통합 로그 모드 활성화 완료!§r");
});

// ==========================================
// --- 메인 루프 (30틱 마다 실행) ---
// ==========================================
system.runInterval(() => {
    try {
        const villagers = world.getDimension("overworld").getEntities({ 
            type: "minecraft:villager_v2" 
        });

        for (const villager of villagers) {
            if (!villager || !villager.isValid()) continue;
            const vId = villager.id.slice(-4);

            try {
                const healthComp = villager.getComponent("minecraft:health");
                if (!healthComp) continue;

                // --- [순위 10] 보안(생존) ---
                if (updateSecurity(villager)) {
                    logAction(villager, 10, "위험 감지 및 보안 로직 가동");
                    continue; 
                }

                // --- [순위 5] 생존(허기) ---
                const currentHunger = updateHunger(villager);
                
                if (pickupFoodOnGround(villager, healthComp)) {
                    logAction(villager, 5, "바닥 음식 발견 및 섭취");
                    continue;
                }
                
                if (eatFromInventory(villager, currentHunger, healthComp)) {
                    logAction(villager, 5, "인벤토리 음식 섭취");
                    continue;
                }

                // 현재 주민이 말하는 중이면 일상 메시지 생성 제한
                if (isVillagerTalking(villager.id)) continue;

                // --- [순위 3] 환경 반응(날씨) ---
                if (Math.random() < 0.4) {
                    if (handleWeatherDialogue(villager)) {
                        logAction(villager, 3, "날씨 변화 감지 및 반응");
                        continue;
                    }
                }

                // --- [순위 1] 일반 일상 ---
                if (Math.random() < 0.08) { 
                    if (handleRoutineDialogue(villager)) {
                        logAction(villager, 1, "일상/직업 대사 생성");
                    }
                }

            } catch (innerErr) {
                console.warn(`주민(${vId}) 루프 오류: ${innerErr}`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 치명적 오류: ${err}§r`);
    }
}, 30);

// --- 인터페이스 가로채기 (UI) ---
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;

    if (target.typeId === "minecraft:villager_v2" && itemStack?.typeId === "minecraft:paper") {
        event.cancel = true;
        system.run(() => {
            try {
                openVillagerMenu(player, target);
                world.sendMessage(`§b[UI] 주민(${target.id.slice(-4)}) 관리 메뉴 호출됨§r`);
            } catch (err) {
                player.sendMessage("§c[오류] UI 실행 중 에러 발생: " + err);
            }
        });
    }
});

// --- 이벤트 모니터링 ---
world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const victim = event.hurtEntity; 
        if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
            const cause = event.damageSource?.cause || "unknown";
            const msg = cause.includes("entity") ? "§4으악! 누가 날 공격해!§r" : "§c아야! 아파!§r";
            addDialogue(victim, msg, 40, 8);
            world.sendMessage(`§c[EVENT] 주민(${victim.id.slice(-4)}) 피격됨 (원인: ${cause})§r`);
        }
    } catch (err) {}
});

world.afterEvents.entityRemove.subscribe((event) => {
    try {
        if (event.typeId === "minecraft:villager_v2") {
            removeVillagerData(event.removedEntityId);
            clearDialogueQueue(event.removedEntityId);
            world.sendMessage(`§7[EVENT] 주민(${event.removedEntityId.slice(-4)}) 데이터 정리 완료§r`);
        }
    } catch (err) {}
});