import React, { useState, useRef, useEffect } from 'react';
import { View, PanResponder, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StarRatingProps {
  rating?: number;
  onRate?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
  color?: string;
  showValue?: boolean;
}

// Helper to get the star icon based on fill level
const getStarIcon = (starIndex: number, rating: number): 'star' | 'star-half-full' | 'star-outline' => {
  const fullThreshold = starIndex;
  const halfThreshold = starIndex - 0.5;
  
  if (rating >= fullThreshold) {
    return 'star';
  } else if (rating >= halfThreshold) {
    return 'star-half-full';
  }
  return 'star-outline';
};

export default function StarRating({
  rating = 0,
  onRate,
  size = 36,
  interactive = true,
  color = '#E11D48',
  showValue = false,
}: StarRatingProps) {
  const [displayRating, setDisplayRating] = useState(rating);
  const ratingRef = useRef(rating);
  const layoutRef = useRef({ x: 0, width: 0 });
  const onRateRef = useRef(onRate);
  const viewRef = useRef<View>(null);
  const lastHapticRef = useRef(0);

  useEffect(() => {
    setDisplayRating(rating);
    ratingRef.current = rating;
  }, [rating]);

  useEffect(() => {
    onRateRef.current = onRate;
  }, [onRate]);

  // Calculate rating with 0.5 increments: 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5
  const calcRating = (pageX: number): number => {
    const { x, width } = layoutRef.current;
    if (width === 0) return ratingRef.current;
    
    const relX = pageX - x;
    // Calculate position as 0-10 (for half stars)
    const rawValue = (relX / width) * 10;
    // Round to nearest 0.5, min 0.5, max 5
    const halfStars = Math.round(rawValue);
    return Math.min(5, Math.max(0.5, halfStars * 0.5));
  };

  const triggerHaptic = (newRating: number) => {
    // Only trigger haptic if rating changed
    if (newRating !== lastHapticRef.current) {
      lastHapticRef.current = newRating;
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const r = calcRating(evt.nativeEvent.pageX);
        if (r !== ratingRef.current) {
          ratingRef.current = r;
          setDisplayRating(r);
          triggerHaptic(r);
        }
      },
      onPanResponderMove: (evt) => {
        const r = calcRating(evt.nativeEvent.pageX);
        if (r !== ratingRef.current) {
          ratingRef.current = r;
          setDisplayRating(r);
          triggerHaptic(r);
        }
      },
      onPanResponderRelease: () => {
        onRateRef.current?.(ratingRef.current);
      },
    })
  ).current;

  const handleLayout = () => {
    if (viewRef.current) {
      viewRef.current.measure((_x, _y, width, _h, pageX) => {
        layoutRef.current = { x: pageX, width };
      });
    }
  };

  // Non-interactive display (read-only stars)
  if (!interactive) {
    return (
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((i) => {
          const icon = getStarIcon(i, displayRating);
          const isActive = icon !== 'star-outline';
          return (
            <MaterialCommunityIcons
              key={i}
              name={icon}
              size={size}
              color={isActive ? color : '#71717A'}
              style={styles.star}
            />
          );
        })}
        {showValue && displayRating > 0 && (
          <Text style={[styles.valueText, { color, fontSize: size * 0.6 }]}>
            {displayRating % 1 === 0 ? displayRating : displayRating.toFixed(1)}
          </Text>
        )}
      </View>
    );
  }

  // Interactive rating with gesture support
  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      style={styles.row}
      testID="star-rating-container"
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const icon = getStarIcon(i, displayRating);
        const isActive = icon !== 'star-outline';
        return (
          <View key={i} style={styles.starTouch}>
            <MaterialCommunityIcons
              name={icon}
              size={size}
              color={isActive ? color : '#71717A'}
            />
          </View>
        );
      })}
      {showValue && displayRating > 0 && (
        <Text style={[styles.valueText, { color, fontSize: size * 0.6 }]}>
          {displayRating % 1 === 0 ? displayRating : displayRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginHorizontal: 2 },
  starTouch: { padding: 3 },
  valueText: { marginLeft: 8, fontWeight: '700' },
});
