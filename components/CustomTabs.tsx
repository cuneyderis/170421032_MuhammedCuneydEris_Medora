import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import {  BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native'
import { useAuth } from '@/contexts/authContext';


export default function CustomTabs({ 
    state, 
    descriptors, 
    navigation 
}: BottomTabBarProps) {
    const { user } = useAuth();
    const isDoctor = user?.role === 'doctor';

    // Kullanıcı rolüne göre gösterilecek tab'ları belirle
    const getVisibleTabs = (routeName: string) => {
        if (isDoctor) {
            // Doktor için gösterilecek tab'lar
            return ['index', 'patients', 'appointment', 'messages', 'profile'].includes(routeName);
        } else {
            // Hasta için gösterilecek tab'lar
            return ['index', 'appointments', 'health-data', 'ai-health', 'profile'].includes(routeName);
        }
    };

    const patientTabIcons: any = {
        index: (isFocused: boolean)=>(
            <Icons.House
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.House>

            
        ),
        'appointments': (isFocused: boolean)=>(
            <Icons.Calendar
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.Calendar>

            
        ),
        'health-data': (isFocused: boolean)=>(
            <Icons.HeartStraight
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.HeartStraight>

            
        ),
        'health-metrics': (isFocused: boolean)=>(
            <Icons.ChartLine
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.ChartLine>

            
        ),
        'ai-health': (isFocused: boolean)=>(
            <Icons.Robot
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.Robot>

            
        ),
        graphs: (isFocused: boolean)=>(
            <Icons.ChartDonut
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.ChartDonut>

            
        ),
        appointment: (isFocused: boolean)=>(
            <Icons.Calendar
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.Calendar>

            
        ),
        profile: (isFocused: boolean)=>(
            <Icons.User
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.User>

            
        ),
    };

    const doctorTabIcons: any = {
        index: (isFocused: boolean)=>(
            <Icons.House
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.House>
        ),
        'patients': (isFocused: boolean)=>(
            <Icons.Users
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.Users>
        ),
        'appointment': (isFocused: boolean)=>(
            <Icons.Calendar
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.Calendar>
        ),
        'messages': (isFocused: boolean)=>(
            <Icons.ChatCircleText
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.ChatCircleText>
        ),
        profile: (isFocused: boolean)=>(
            <Icons.User
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400}
            >

            </Icons.User>
        ),
    };
    
    const tabbarIcons = isDoctor ? doctorTabIcons : patientTabIcons;
  

  return (
    <View style={styles.tabbar}>
      {state.routes
        .filter(route => {
          // Kullanıcı rolüne göre tab'ları filtrele ve icon'u olan tab'ları göster
          return getVisibleTabs(route.name) && tabbarIcons[route.name];
        })
        .map((route, index) => {
        const { options } = descriptors[route.key];
        const label: any =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const routeIndex = state.routes.findIndex(r => r.key === route.key);
        const isFocused = state.index === routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            // href={buildHref(route.name, route.params)}
            key= {route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            {
              tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)
            }
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
    tabbar:{
        flexDirection : "row",
        width: '100%',
        height: Platform.OS == 'ios' ? verticalScale(73) : verticalScale(55),
        backgroundColor: colors.neutral800,
        justifyContent: "space-around",
        alignItems: "center",
        borderTopColor: colors.neutral700,
        borderTopWidth: 1,
    },
    tabbarItem:{
        marginBottom : Platform.OS == 'ios' ? spacingY._10 : spacingY._5,
        justifyContent: "center",
        alignItems: "center",
        
    },
    
})