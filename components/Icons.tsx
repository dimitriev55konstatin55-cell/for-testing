import React from 'react';

export const CoinIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <img 
        src="image/coin.png"
        alt="Coin"
        width={size} 
        height={size}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
    />
);

export const SantaIcon = ({ size = 40 }: { size?: number }) => (
    <img 
        src="image/santa_claus.png"
        alt="Santa"
        width={size}
        height={size}
        className="object-contain filter drop-shadow-md"
        style={{ width: size, height: size }}
    />
);

export const GiftIcon = ({ size = 40 }: { size?: number }) => (
    <img 
        src="image/gift.png"
        alt="Gift"
        width={size}
        height={size}
        className="object-contain filter drop-shadow-md"
        style={{ width: size, height: size }}
    />
);

export const ShopItemImage = ({ id, size = 50 }: { id: string, size?: number }) => {
    let src = "";
    switch(id) {
        case 'smallPack': // Mandarin
            src = "image/Tangerine.png";
            break;
        case 'mediumPack': // Gift
            src = "image/gift1.png";
            break;
        case 'largePack': // Sleigh -> Replaced with Deer (Reindeer) as Sled image was broken
            src = "image/deer.png";
            break;
        case 'magicSnowflake': // Snowflake
            src = "image/snowflake.png";
            break;
        case 'santaBag': // Sack (Money Bag as proxy for Sack)
            src = "image/money_bag.png";
            break;
        case 'bomb':
            src = "/image/bomb.png";
            break;
        default: 
            src = "image/gift2.png";
    }

    return (
        <img 
            src={src}
            alt={id}
            width={size}
            height={size}
            className="object-contain filter drop-shadow-sm"
            style={{ width: size, height: size }}
        />
    );
};