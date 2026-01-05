import React, { useState } from 'react'
import { Smile } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReactionPickerProps {
    onReact: (emoji: string) => void
    existingReactions?: string[]
    className?: string
}

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '👍']
const ALL_REACTIONS = [
    '❤️', '😂', '😮', '😢', '🙏', '👍', '👎', '🔥', '🎉', '💯',
    '😍', '🥰', '😘', '😊', '😁', '🤣', '😅', '😇', '🙂', '😉',
    '😌', '😔', '😪', '😴', '🤤', '😋', '😛', '😝', '😜', '🤪',
    '🤨', '🧐', '🤓', '😎', '🥳', '😏', '😒', '😞', '😟', '😕',
    '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😤', '😠', '😡',
    '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻',
    '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀',
    '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟',
    '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '🧡', '💛', '💚', '💙', '💜', '🤎',
    '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💬'
]

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
    onReact,
    existingReactions = [],
    className
}) => {
    const [showAll, setShowAll] = useState(false)

    const handleReact = (emoji: string) => {
        onReact(emoji)
        setShowAll(false)
    }

    return (
        <div className={cn(
            "bg-[#233138] rounded-2xl shadow-2xl border border-[#2f3b43] overflow-hidden animate-in zoom-in-95 duration-200",
            className
        )}>
            {/* Quick Reactions */}
            <div className="flex items-center gap-1 p-2">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => handleReact(emoji)}
                        className={cn(
                            "text-2xl p-2 rounded-lg hover:bg-[#2a3942] transition-all hover:scale-125 active:scale-95",
                            existingReactions.includes(emoji) && "bg-[#2a3942] ring-2 ring-[#00a884]"
                        )}
                    >
                        {emoji}
                    </button>
                ))}
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="p-2 rounded-lg hover:bg-[#2a3942] transition-colors ml-1"
                >
                    <Smile className="w-5 h-5 text-[#8696a0]" />
                </button>
            </div>

            {/* All Reactions Grid */}
            {showAll && (
                <div className="border-t border-[#2f3b43] p-3 max-h-64 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-8 gap-1">
                        {ALL_REACTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => handleReact(emoji)}
                                className={cn(
                                    "text-2xl p-2 rounded-lg hover:bg-[#2a3942] transition-all hover:scale-125 active:scale-95",
                                    existingReactions.includes(emoji) && "bg-[#2a3942] ring-2 ring-[#00a884]"
                                )}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface ReactionDisplayProps {
    reactions: Array<{ emoji: string; count: number; users: any[] }>
    onReactionClick: (emoji: string) => void
    currentUserId: string
}

export const ReactionDisplay: React.FC<ReactionDisplayProps> = ({
    reactions,
    onReactionClick,
    currentUserId
}) => {
    if (!reactions || reactions.length === 0) return null

    return (
        <div className="flex flex-wrap gap-1 mt-1">
            {reactions.map(({ emoji, count, users }) => {
                const hasReacted = users.some(u => u.id === currentUserId)

                return (
                    <button
                        key={emoji}
                        onClick={() => onReactionClick(emoji)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-110 active:scale-95",
                            hasReacted
                                ? "bg-[#00a884]/20 border border-[#00a884] text-[#00a884]"
                                : "bg-[#2a3942] border border-[#3f4b53] text-[#8696a0] hover:border-[#8696a0]"
                        )}
                        title={users.map(u => u.username).join(', ')}
                    >
                        <span className="text-sm">{emoji}</span>
                        <span className="font-medium">{count}</span>
                    </button>
                )
            })}
        </div>
    )
}
