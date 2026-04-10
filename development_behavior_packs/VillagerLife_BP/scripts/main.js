import { world, system } from "@minecraft/server";
// [필독] import 문은 반드시 블록({}) 밖, 최상단에 위치해야 합니다.
import { addDialogue, isVillagerTalking } from "./chatManager.js";
import { handleRoutineDialogue } from "./scheduleManager.js";
import { updateHunger, pickupFoodOnGround, eatFromInventory } from "./needsManager.js";
import { updateSecurity } from "./securityManager.js";
import { handleWeatherDialogue } from "./weatherManager.js";
import { openVillagerMenu } from "./uiManager.js";

/**
 * 전역 로그 출력 함수
 */
function logAction(villager, priority, action) {
    const vId = villager.id.slice(-4);
    const type = villager.typeId === "custom:militia" ? "자경단" : "주민";
    world.sendMessage(`§7[LOG][P${priority}] ${type}(${vId}): ${action}§r`);
}

// 스크립트 엔진이 이 파일을 읽자마자 뜨는 로그 (가장 먼저 확인해야 함)
world.sendMessage("§e[시스템] VillagerLife 모드 로드 중...§r");

system.run(() => {
    // 월드 진입 시 출력되는 로그
    world.sendMessage("§a[시스템] VillagerLife 통합 로그 모드 활성화 성공!§r");
});

// 메인 틱 루프 (30틱 = 1.5초 주기)
system.runInterval(() => {
    try {
        const overworld = world.getDimension("overworld");
        // 일반 주민과 자경단 모두 검색
        const villagers = [
            ...overworld.getEntities({ type: "minecraft:villager_v2" }),
            ...overworld.getEntities({ type: "custom:militia" })
        ];

        for (const villager of villagers) {
            if (!villager?.isValid()) continue;

            const healthComp = villager.getComponent("minecraft:health");
            if (!healthComp) continue;

            // 1. 보안 체크 (최우선)
            if (updateSecurity(villager)) {
                if (system.currentTick % 100 === 0) logAction(villager, 10, "보안 경계 작동");
                continue; 
            }

            // 2. 허기 및 식사 로직
            const currentHunger = updateHunger(villager);
            if (pickupFoodOnGround(villager, healthComp)) logAction(villager, 5, "음식 습득");
            if (eatFromInventory(villager, currentHunger, healthComp)) logAction(villager, 6, "식사 완료");

            // 3. 대화 로직
            if (!isVillagerTalking(villager.id)) {
                if (Math.random() < 0.4 && handleWeatherDialogue(villager)) {
                    logAction(villager, 3, "날씨 대화");
                } else if (Math.random() < 0.08 && handleRoutineDialogue(villager)) {
                    logAction(villager, 1, "일상 대화");
                }
            }
        }
    } catch (err) {
        // 실행 중 에러가 나면 채팅창에 바로 표시
        world.sendMessage(`§4[런타임 에러] ${err}§r`);
    }
}, 30);

// 종이로 우클릭 시 메뉴 호출
world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;
    const isVillager = target.typeId === "minecraft:villager_v2" || target.typeId === "custom:militia";

    if (isVillager && itemStack?.typeId === "minecraft:paper") {
        event.cancel = true;
        system.run(() => openVillagerMenu(player, target));
    }
});