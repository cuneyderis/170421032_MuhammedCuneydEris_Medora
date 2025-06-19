import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import React, { useState, useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';

// Example conversation type
type Conversation = {
  id: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: boolean;
};

const MessagesScreen = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  useEffect(() => {
    // Simulate loading conversations
    setLoading(true);
    
    // Mock data
    const mockConversations: Conversation[] = [
      {
        id: '1',
        patientName: 'Ahmet Yılmaz',
        lastMessage: 'İlaçlarımı alıyorum, teşekkürler.',
        lastMessageTime: '10:30',
        unread: true,
      },
      {
        id: '2',
        patientName: 'Ayşe Demir',
        lastMessage: 'Randevumu erteleyebilir miyiz?',
        lastMessageTime: 'Dün',
        unread: false,
      },
      {
        id: '3',
        patientName: 'Mehmet Kaya',
        lastMessage: 'Sonuçlarım hakkında konuşabilir miyiz?',
        lastMessageTime: 'Dün',
        unread: true,
      },
      {
        id: '4',
        patientName: 'Zeynep Çelik',
        lastMessage: 'İyi hissediyorum, teşekkürler doktor.',
        lastMessageTime: '22/06',
        unread: false,
      },
    ];
    
    setTimeout(() => {
      setConversations(mockConversations);
      setLoading(false);
    }, 500);
  }, []);

  const filteredConversations = conversations.filter(
    conversation => conversation.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversationItem = (conversation: Conversation) => (
    <TouchableOpacity 
      key={conversation.id}
      style={styles.conversationCard}
      onPress={() => console.log('Open conversation', conversation.id)}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Icons.User size={24} color={colors.primary} weight="duotone" />
        </View>
        {conversation.unread && <View style={styles.unreadBadge} />}
      </View>
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Typo fontWeight="600">{conversation.patientName}</Typo>
          <Typo size={12} color={colors.neutral400}>{conversation.lastMessageTime}</Typo>
        </View>
        <Typo 
          size={14} 
          color={conversation.unread ? colors.white : colors.neutral400}
          fontWeight={conversation.unread ? '500' : 'normal'}
        >
          {conversation.lastMessage}
        </Typo>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Typo size={24} fontWeight="700">Mesajlar</Typo>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => console.log('New message')}
        >
          <Icons.PencilSimpleLine size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Icons.MagnifyingGlass size={20} color={colors.neutral400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hasta ara..."
          placeholderTextColor={colors.neutral400}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <ScrollView style={styles.container}>
        {loading ? (
          <View style={styles.centered}>
            <Typo>Yükleniyor...</Typo>
          </View>
        ) : filteredConversations.length > 0 ? (
          <View style={styles.conversationsList}>
            {filteredConversations.map(renderConversationItem)}
          </View>
        ) : (
          <View style={styles.centered}>
            <Icons.ChatText size={48} color={colors.neutral400} weight="duotone" />
            <Typo style={styles.emptyText}>Henüz mesaj bulunmamaktadır.</Typo>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._20,
  },
  newMessageButton: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    marginHorizontal: spacingX._20,
    paddingHorizontal: spacingX._15,
    borderRadius: 12,
    marginBottom: spacingY._15,
  },
  searchInput: {
    flex: 1,
    height: 45,
    color: colors.white,
    marginLeft: spacingX._10,
  },
  conversationsList: {
    paddingHorizontal: spacingX._20,
    paddingBottom: spacingY._20,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral900,
    padding: spacingY._15,
    borderRadius: 12,
    marginBottom: spacingY._10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacingX._15,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.neutral900,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacingY._60,
  },
  emptyText: {
    marginTop: spacingY._10,
    color: colors.neutral400,
    textAlign: 'center',
  },
}); 