// worker/src/streamelements/types.ts

type ActivityType =
  | 'event'
  | 'follow'
  | 'tip'
  | 'communityGiftPurchase'
  | 'channelPointsRedemption'
  | 'sponsor'
  | 'superchat'
  | 'host'
  | 'raid'
  | 'subscriber'
  | 'cheer'
  | 'cheerPurchase'
  | 'charityCampaignDonation'
  | 'redemption'
  | 'merch'
  | 'fan'
  | 'supporter'
  | 'follower'
  | 'stars'
  | 'share'
  | 'videolike'
  | 'elixir'
  | 'purchase'
  | 'hypetrainStart'
  | 'hypetrainProgress'
  | 'hypetrainEnd'
  | 'giveaway'
  | 'sponsorship'
  | 'sponsorshipPassive'

type Provider =
  | 'twitch'
  | 'youtube'
  | 'represent'
  | 'fourthwall'
  | 'lunar'
  | 'lilithgames'
  | 'x'
  | 'StreamElements'
  | 'grabtap'
  | 'kick'

export type ActivityMessageType = {
  id: string
  ts: string
  type: 'message'
  topic: 'channel.activities'
  room: string
  data: {
    type: ActivityType
    provider: Provider
    channel: string
    createdAt: string
    data: unknown
    _id: string
    updatedAt: string
    activityId: string
    sessionEventsCount: number
  }
}

export type TipActivityData = {
  amount: number
  currency: string
  username: string
  tipId: string
  message?: string
  avatar: string
}
