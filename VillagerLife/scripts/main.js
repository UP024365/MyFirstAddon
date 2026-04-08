import { world, system } from "@minecraft/server";

// 임포트 시작 로그
world.sendMessage("§e[시스템] 모듈 임포트를 시작합니다...§r");

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

// 모든 임포트 완료 후 실행
system.run(() => {
    world.sendMessage("§a[시스템] 모든 모듈이 성공적으로 임포트되었습니다!§r");
    world.sendMessage("§a[시스템] VillagerLife 디버깅 모드 활성화 완료!§r");
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

            const vId = villager.id.slice(-4); // 디버그용 짧은 ID

            try {
                const healthComp = villager.getComponent("minecraft:health");
                if (!healthComp) continue;

                // 1. 보안 및 허기 데이터 업데이트
                const isUnderAttack = updateSecurity(villager);
                const currentHunger = updateHunger(villager);

                // [로그] 보안 상태 확인
                if (isUnderAttack) {
                    world.sendMessage(`§4[SECURITY] 주민(${vId}) 위협 감지! 로직 우선순위에 따라 도망 중...§r`);
                    continue; 
                }

                // 2. 대화 중 여부 체크
                if (isVillagerTalking(villager.id)) {
                    // 이미 말하는 중이면 다른 로그 생략
                    continue;
                }

                // 3. 날씨 반응 체크
                const weatherMsg = getWeatherMessage(villager);
                if (weatherMsg) {
                    if (Math.random() < 0.4) {
                        showSpeechBubble(villager, weatherMsg, 60);
                        world.sendMessage(`§3[WEATHER] 주민(${vId}) 날씨 반응 출력: ${weatherMsg}§r`);
                        continue;
                    } else {
                        world.sendMessage(`§b[LOG] 주민(${vId}) 날씨 감지했으나 확률(40%)에 의해 대사 미출력§r`);
                    }
                }

                // 4. 생존 로직 (음식)
                // pickupFoodOnGround와 eatFromInventory 내부에서 이미 로그를 찍도록 설계되어 있음
                if (pickupFoodOnGround(villager, healthComp)) {
                    world.sendMessage(`§d[ACTION] 주민(${vId}) 바닥 음식 습득 성공§r`);
                    continue; 
                }
                
                if (eatFromInventory(villager, currentHunger, healthComp)) {
                    world.sendMessage(`§b[ACTION] 주민(${vId}) 인벤토리 식사 완료 (허기: ${currentHunger})§r`);
                    continue; 
                }

                // 5. 배고픔 경고 로그 (음식이 없을 때)
                if (currentHunger < 20) {
                    world.sendMessage(`§6[LOG] 주민(${vId}) 매우 배고픔 상태! (현재 수치: ${currentHunger})§r`);
                }

                // 6. 일상 대사
                if (Math.random() < 0.1) { 
                    let message = getRoutineMessage(villager);
                    showSpeechBubble(villager, message, 60);
                    world.sendMessage(`§e[ROUTINE] 주민(${vId}) 일상 대사 출력: ${message}§r`);
                }

            } catch (innerErr) {
                world.sendMessage(`§6[INNER ERROR] 주민(${vId}) 처리 중 오류: ${innerErr}§r`);
            }
        }
    } catch (err) {
        world.sendMessage(`§4[SYSTEM CRASH] 메인 루프 치명적 오류: ${err}§r`);
    }
}, 30);

// ==========================================
// --- 이벤트 리스너 로그 강화 ---
// ==========================================

// 피격 이벤트
world.afterEvents.entityHurt.subscribe((event) => {
    try {
        const victim = event.hurtEntity; 
        if (victim?.isValid() && victim.typeId === "minecraft:villager_v2") {
            const cause = event.damageSource?.cause ? String(event.damageSource.cause).toLowerCase() : "unknown";
            let msg = cause.includes("entity") ? "§4으악! 몹이다!§r" : "§c아야! 왜 때려!§r"; 
            
            showSpeechBubble(victim, msg, 40, true); 
            world.sendMessage(`§c[EVENT] 주민(${victim.id.slice(-4)}) 피격 발생! 원인: ${cause}§r`);
        }
    } catch (err) {
        console.error(`피격 이벤트 오류: ${err}`);
    }
});

// 제거 이벤트 (데이터 정리)
world.afterEvents.entityRemove.subscribe((event) => {
    try {
        if (event.typeId === "minecraft:villager_v2") {
            removeVillagerData(event.removedEntityId); 
            const shortId = event.removedEntityId ? event.removedEntityId.slice(-4) : "unknown";
            world.sendMessage(`§7[EVENT] 주민 데이터 제거됨 (ID: ${shortId})§r`);
        }
    } catch (err) {}
});

// [시스템 체크] 로드 시 출력
system.run(() => {
    world.sendMessage("§a[시스템] VillagerLife 모든 로그 모드 활성화!§r");
    world.sendMessage("§7보안, 날씨, 행동, 배고픔 상태가 채팅창에 모두 표시됩니다.§r");
});