import { Text, View } from 'react-native';

import { useSession } from '../../Share/ctx';

export default function About() {
  const { signOut } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>
        About
      </Text>
    </View>
  );
}
