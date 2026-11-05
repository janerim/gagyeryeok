import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
  Keyboard,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from 'react-native';

const MARGIN = 12;

/**
 * 폼 화면에서 키보드가 하단 버튼과 입력칸을 가리지 않게 한다.
 * - bottom: 키보드 높이. 화면 루트의 paddingBottom 으로 주면 스크롤 영역과 하단 버튼이 키보드 위로 올라온다
 *   (폼은 모두 화면 맨 아래까지 닿는 모달이라 키보드 높이를 그대로 쓴다)
 * - scrollRef, onScroll: 폼의 ScrollView 에 연결한다. 포커스된 입력이 가려졌을 때 보이는 데까지 올리는 데 쓴다
 */
export function useKeyboardInset() {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [bottom, setBottom] = useState(0);
  const offsetY = useRef(0);

  useEffect(() => {
    const subs = [
      Keyboard.addListener('keyboardWillShow', (e) => {
        Keyboard.scheduleLayoutAnimation(e);
        setBottom(e.endCoordinates.height);
      }),
      Keyboard.addListener('keyboardWillHide', (e) => {
        Keyboard.scheduleLayoutAnimation(e);
        setBottom(0);
      }),
      // 화면이 줄어든 뒤, 포커스된 입력이 스크롤 영역 아래로 밀려나 있으면 보이는 데까지 올린다
      Keyboard.addListener('keyboardDidShow', () => {
        const input = TextInput.State.currentlyFocusedInput();
        const scroll = scrollRef.current;
        if (!input || !scroll) return;
        scroll.measureInWindow((_sx, sy, _sw, sh) => {
          input.measureInWindow((_x, y, _w, h) => {
            const over = y + h + MARGIN - (sy + sh);
            if (over > 0) scroll.scrollTo({ y: offsetY.current + over });
          });
        });
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offsetY.current = e.nativeEvent.contentOffset.y;
  };

  return { scrollRef, bottom, onScroll };
}
