export function findNearestBlock(entity, blockType, radius) {
    const { x, y, z } = entity.location;
    
    // 주변 반경을 탐색하며 특정 블록(상자)을 찾습니다.
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dz = -radius; dz <= radius; dz++) {
                const block = entity.dimension.getBlock({ x: x + dx, y: y + dy, z: z + dz });
                if (block && block.typeId === blockType) {
                    return { x: x + dx, y: y + dy, z: z + dz };
                }
            }
        }
    }
    return null;
}