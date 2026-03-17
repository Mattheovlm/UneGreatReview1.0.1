import React, { useState, useRef, useEffect } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StarRatingProps {
  rating?: number;
  onRate?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
  color?: string;
}

export default function StarRating({
  rating = 0,
  onRate,
  size = 36,
  interactive = true,
  color = '#E11D48',
}: StarRatingProps) {
  const [displayRating, setDisplayRating] = useState(rating);
  const ratingRef = useRef(rating);
  const layoutRef = useRef({ x: 0, width: 0 });
  const onRateRef = useRef(onRate);
  const viewRef = useRef<View>(null);

  useEffect(() => {
    setDisplayRating(rating);
    ratingRef.current = rating;
  }, [rating]);

  useEffect(() => {
    onRateRef.current = onRate;
  }, [onRate]);

  const calcRating = (pageX: number) => {
    const { x, width } = layoutRef.current;
    if (width === 0) return ratingRef.current;
    const relX = pageX - x;
    return Math.min(5, Math.max(1, Math.ceil((relX / width) * 5)));
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
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderMove: (evt) => {
        const r = calcRating(evt.nativeEvent.pageX);
        if (r !== ratingRef.current) {
          ratingRef.current = r;
          setDisplayRating(r);
          Haptics.selectionAsync().catch(() => {});
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

  if (!interactive) {
    return (
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((i) => (
          <MaterialCommunityIcons
            key={i}
            name={i <= displayRating ? 'star' : 'star-outline'}
            size={size}
            color={i <= displayRating ? color : '#71717A'}
            style={styles.star}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      ref={viewRef}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
      style={styles.row}
      testID="star-rating-container"
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.starTouch}>
          <MaterialCommunityIcons
            name={i <= displayRating ? 'star' : 'star-outline'}
            size={size}
            color={i <= displayRating ? color : '#71717A'}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  star: { marginHorizontal: 2 },
  starTouch: { padding: 3 },
});
