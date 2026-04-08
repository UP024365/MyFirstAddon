import { world, system } from "@minecraft/server";
import { showSpeechBubble, isVillagerTalking } from "./chatManager.js";
import { getRoutineMessage } from "./scheduleManager.js";
import { 
    updateHunger, 
    removeVillagerData, 
    pickupFoodOnGround, 
    eatFromInventory 
} from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { getWeatherMessage } from "./weatherManager.js";

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

            try {
                const healthComp = villager.getComponent("minecraft:health");
                if (!healthComp) continue;

                const isUnderAttack = updateSecurity(villager);
                const currentHunger = updateHunger(villager);

                if (isUnderAttack) continue; 

                // 대화 중이 아닐 때만 판단
                if (!isVillagerTalking(villager.id)) {
                    
                    // 1. 날씨 체크 (비/눈이 오면 일상 대사보다 우선순위를 높임)
                    const weatherMsg = getWeatherMessage(villager);
                    if (weatherMsg) {
                        // 비가 올 때는 40~50% 정도로 확률을 높이면 더 자주 반응합니다.
                        if (Math.random() < 0.4) {
                            showSpeechBubble(villager, weatherMsg, 60);
                            world.sendMessage(`§3[DEBUG] 주민(${villager.id.slice(-4)}) 날씨 반응: ${weatherMsg}§r`);
                            continue; // 날씨 반응을 했으면 이번 루프는 종료
                        }
                        // 날씨 반응 확률에 걸리지 않았더라도, 비가 오는 중엔 일상 대사를 아예 안 하게 하려면 
                        // 여기서 return이나 continue를 고려할 수 있습니다.
                    }

                    // 2. 생존 필수 로직 (음식 줍기/먹기)
                    if (pickupFoodOnGround(villager, healthComp)) continue; 
                    if (eatFromInventory(villager, currentHunger, healthComp)) continue; 

                    // 3. 일상 대사 (날씨가 맑을 때나 날씨 반응을 안 했을 때만)
                    if (Math.random() < 0.1) { 
                        let message = getRoutineMessage(villager);
                        showSpeechBubble(villager, message, 60);
                        world.sendMessage(`§e[DEBUG] 주민(${villager.id.slice(-4)}) 일상 대사: ${message}§r`);
                    }
                }
            } catch (innerErr) {
                console.warn(`주민 처리 오류: ${innerErr}`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 오류: ${err}§r`);
    }
}, 30);

// ==========================================
// --- 이벤트 리스너 ---
// ==========================================

// 피격 이벤트: 즉각적인 반응을 위해 afterEvents 사용
world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const victim = event.hurtEntity; 
        if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
            // damageSource가 없을 경우를 대비한 안전한 처리
            const cause = event.damageSource?.cause ? String(event.damageSource.cause).toLowerCase() : "unknown";
            let msg = cause.includes("entity") ? "§4으악! 몹이다!§r" : "§c아야! 왜 때려!§r"; 
            
            showSpeechBubble(victim, msg, 40, true); // 피격은 force=true로 기존 말 끊기
            world.sendMessage(`§c[DEBUG] 주민 피격! 원인: ${cause}§r`);
        }
    } catch (err) {
        console.error(`피격 이벤트 처리 오류: ${err}`);
    }
});

// 제거 이벤트: 메모리 관리를 위한 데이터 정리
world.afterEvents.entityRemove.subscribe((event) => {
    try {
        if (event.typeId === "minecraft:villager_v2") {
            removeVillagerData(event.removedEntityId); 
            // 텍스트 출력 시 slice 오류 방지
            const shortId = event.removedEntityId ? event.removedEntityId.slice(-4) : "unknown";
            world.sendMessage(`§7[DEBUG] 주민 데이터 제거됨 (ID: ${shortId})§r`);
        }
    } catch (err) {
        console.error(`제거 이벤트 처리 오류: ${err}`);
    }
});

// [시스템 체크] 모든 로직 로드 후 실행
system.run(() => {
    world.sendMessage("§a[시스템] VillagerLife 디버깅 모드 활성화 완료!§r");
});