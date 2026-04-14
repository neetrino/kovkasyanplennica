import { Card } from '@shop/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { ProfileMenuDrawer } from '@/components/ProfileMenuDrawer';
import type { UserProfile, ProfileTab, ProfileTabConfig } from './types';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  tabs: ProfileTabConfig[];
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  t: (key: string) => string;
}

export function ProfileHeader({ profile, tabs, activeTab, onTabChange, t }: ProfileHeaderProps) {
  return (
    <>
      <div className="lg:w-64 flex-shrink-0">
        <Card className="mb-4 p-4">
          <div className="flex flex-row items-center gap-4">
            <UserAvatar
              firstName={profile?.firstName}
              lastName={profile?.lastName}
              size="lg"
              className="flex-shrink-0"
            />

            <div className="min-w-0 flex-1 break-words">
              <h1 className="mb-1 break-words text-lg font-bold text-gray-900">
                {profile?.firstName && profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile?.firstName
                    ? profile.firstName
                    : profile?.lastName
                      ? profile.lastName
                      : t('profile.myProfile')}
              </h1>
              {profile?.email && (
                <p className="mb-1 break-words text-sm font-bold text-gray-900">{profile.email}</p>
              )}
              {profile?.phone && (
                <p className="break-words text-sm text-gray-500">{profile.phone}</p>
              )}
            </div>
          </div>
        </Card>

        <aside className="hidden lg:block">
          <nav className="space-y-1 rounded-lg border border-gray-200 bg-white p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={`flex-shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                  {tab.icon}
                </span>
                <span className="text-left">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>
      </div>

      <div className="lg:hidden mb-6">
        <ProfileMenuDrawer
          tabs={tabs}
          activeTab={activeTab}
          onSelect={(tabId) => onTabChange(tabId as ProfileTab)}
        />
      </div>
    </>
  );
}
