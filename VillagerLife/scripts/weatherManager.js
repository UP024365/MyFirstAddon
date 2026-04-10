// weatherManager.js
import { world } from "@minecraft/server";
// showSpeechBubble 대신 addDialogue를 임포트합니다.
import { addDialogue } from "./chatManager.js"; 

world.sendMessage("§b[모듈 로드] weatherManager.js 연결 완료§r");

/**
 * 날씨 상태를 체크하고 주민에게 적절한 대사를 추가합니다.
 */
export function handleWeatherDialogue(villager) {
    const dimension = world.getDimension("overworld");
    const location = villager.location;
    
    // 1. 천둥번개 체크 (가장 위험하므로 높은 우선순위 7 부여)
    if (dimension.isThundering) {
        const thunderMsgs = [
            "§b으악! 번개다! 다들 조심해!§r",
            "§b하늘이 노하셨나 봐, 빨리 숨자!§r",
            "§b번개에 맞으면 좀비가 될지도 몰라...§r"
        ];
        const msg = thunderMsgs[Math.floor(Math.random() * thunderMsgs.length)];
        addDialogue(villager, msg, 60, 7); 
        return true;
    }

    // 2. 비 또는 눈 체크 (중간 우선순위 3 부여)
    if (dimension.isRaining) {
        let isSnowing = location.y > 120;

        try {
            const biomeId = dimension.getBiomeIdAt(location); 
            if (biomeId.includes("frozen") || biomeId.includes("ice") || biomeId.includes("cold")) {
                isSnowing = true;
            }
        } catch (e) {}

        if (isSnowing) {
            const snowMsgs = [
                "§f와아, 눈이다! 온 세상이 하얘졌어.§r",
                "§f눈이 오니까 길이 미끄럽네, 조심해야지.§r",
                "§f누가 나랑 눈사람 만들 사람 없나?§r"
            ];
            const msg = snowMsgs[Math.floor(Math.random() * snowMsgs.length)];
            addDialogue(villager, msg, 60, 3);
        } else {
            const rainMsgs = [
                "§3아이구 비가 오네! 빨리 집으로 가야겠다.§r",
                "§3빨래 널어놨는데 큰일이군...§r",
                "§3비 오는 날은 파전인데 말이야.§r"
            ];
            const msg = rainMsgs[Math.floor(Math.random() * rainMsgs.length)];
            addDialogue(villager, msg, 60, 3);
        }
        return true;
    }

    return false; 
}