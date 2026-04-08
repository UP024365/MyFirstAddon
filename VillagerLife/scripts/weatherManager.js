// weatherManager.js
import { world } from "@minecraft/server";

world.sendMessage("§b[모듈 로드] weatherManager.js 연결 완료§r");

export function getWeatherMessage(villager) {
    const dimension = world.getDimension("overworld");
    const location = villager.location;
    
    // 1. 천둥번개 체크
    if (dimension.isThundering) {
        const thunderMsgs = [
            "§b으악! 번개다! 다들 조심해!§r",
            "§b하늘이 노하셨나 봐, 빨리 숨자!§r",
            "§b번개에 맞으면 좀비가 될지도 몰라...§r"
        ];
        return thunderMsgs[Math.floor(Math.random() * thunderMsgs.length)];
    }

    // 2. 비 또는 눈 체크
    if (dimension.isRaining) {
        let isSnowing = location.y > 120; // 고도가 높으면 일단 눈으로 가정

        try {
            // 최신 API 규격: getBiomeIdAt을 사용합니다.
            const biomeId = dimension.getBiomeIdAt(location); 
            if (
                biomeId.includes("frozen") || 
                biomeId.includes("ice") || 
                biomeId.includes("cold")
            ) {
                isSnowing = true;
            }
        } catch (e) {
            // 메서드가 없거나 오류 발생 시 무시 (기본 비 대사로 진행)
        }

        if (isSnowing) {
            const snowMsgs = [
                "§f와아, 눈이다! 온 세상이 하얘졌어.§r",
                "§f눈이 오니까 길이 미끄럽네, 조심해야지.§r",
                "§f누가 나랑 눈사람 만들 사람 없나?§r",
                "§f눈 치우려면 고생 좀 하겠는걸...§r"
            ];
            return snowMsgs[Math.floor(Math.random() * snowMsgs.length)];
        } else {
            const rainMsgs = [
                "§3아이구 비가 오네! 빨리 집으로 가야겠다.§r",
                "§3빨래 널어놨는데 큰일이군...§r",
                "§3비 오는 날은 파전인데 말이야.§r",
                "§3지붕이 새지 않아야 할 텐데.§r"
            ];
            return rainMsgs[Math.floor(Math.random() * rainMsgs.length)];
        }
    }

    return null; 
}