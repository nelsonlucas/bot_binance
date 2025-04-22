export type SymbolStatus = {
    PRE_TRADING:"PRE_TRADING",
    TRADING:"TRADING",
    POST_TRADING:"POST_TRADING",
    END_OF_DAY:"END_OF_DAY",
    HALT:"HALT",
    AUCTION_MATCH:"AUCTION_MATCH",
    BREAK:"BREAK"
}

export type OrderSide = {
    BUY:"BUY",
    SELL:"SELL"
}

export type OrderType = {
    LIMIT:"LIMIT",
    MARKET:"MARKET"
}

export type OrderStatus = {
    NEW:"NEW",
    PENDING_NEW:"PENDING_NEW",
    PARTIALLY_FILLED:"PARTIALLY_FILLED",
    FILLED:"FILLED",
    CANCELED:"CANCELED",
    PENDING_CANCEL:"PENDING_CANCEL",
    REJECTED:"REJECTED",
    EXPIRED:"EXPIRED",
    EXPIRED_IN_MATCH:"EXPIRED_IN_MATCH",
}

export type OrderResponseStatus = {
    ACK:"ACK",
    RESULT:"RESULT",
    FULL:"FULL"
}
