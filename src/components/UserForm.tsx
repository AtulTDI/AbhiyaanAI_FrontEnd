import { getActiveApplications } from '../api/applicationApi';
import { FieldConfig } from '../types';
import { CreateUserPayload, User } from '../types/User';
import { logger } from '../utils/logger';
import { getAuthData } from '../utils/storage';
import DynamicForm from './DynamicForm';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type ApplicationOption = {
  label: string;
  value: string;
};

type Props = {
  role: string;
  mode: 'create' | 'edit';
  onCreate: (data: CreateUserPayload) => void;
  userToEdit: User;
  setUserToEdit: (user: User | null) => void;
  setShowAddUserView: (visible: boolean) => void;
};

type UserFormValues = CreateUserPayload & {
  applicationId?: string;
};

const scrollViewStyle = { flex: 1 };
const scrollContentStyle = { flexGrow: 1, padding: 16 };

export default function UserForm({
  role,
  mode,
  onCreate,
  userToEdit,
  setUserToEdit,
  setShowAddUserView
}: Props) {
  const { t } = useTranslation();
  const [applicationOptions, setApplicationOptions] = useState<ApplicationOption[]>([]);
  const [loggedInUserRole, setLoggedInUserRole] = useState<
    'Admin' | 'User' | 'SuperAdmin' | null
  >(null);

  useEffect(() => {
    (async () => {
      const { role: storedRole } = await getAuthData();

      if (
        storedRole === 'Admin' ||
        storedRole === 'SuperAdmin' ||
        storedRole === 'User'
      ) {
        setLoggedInUserRole(storedRole);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getActiveApplications(0, 100000);
        const apps = response.data.items || [];
        const appArray = Array.isArray(apps) ? apps : [apps];

        const formatted = appArray.map((app) => ({
          label: app.name,
          value: app.id
        }));
        setApplicationOptions(formatted);
      } catch (error) {
        logger.error('Failed to fetch applications', error);
      }
    };

    if (loggedInUserRole === 'SuperAdmin' && role === 'Admin') {
      void fetchApplications();
    }
  }, [loggedInUserRole, role]);

  const getUserFields = (): FieldConfig[] => {
    const fields: FieldConfig[] = [
      {
        name: 'firstName',
        label: t('firstName'),
        placeholder: t('placeholder.enterFirstName'),
        type: 'text',
        required: true
      },
      {
        name: 'lastName',
        label: t('lastName'),
        placeholder: t('placeholder.enterLastName'),
        type: 'text',
        required: true
      },
      {
        name: 'email',
        label: t('email'),
        placeholder: 'example@domain.com',
        type: 'email',
        required: true,
        disabled: mode === 'edit'
      },
      {
        name: 'password',
        label: t('password'),
        placeholder: t('placeholder.passwordHint'),
        type: 'password',
        required: true,
        disabled: mode === 'edit'
      },
      {
        name: 'phoneNumber',
        label: t('mobile'),
        placeholder: t('placeholder.mobileHint'),
        type: 'number',
        required: true
      }
    ];

    const shouldShowApplicationField =
      loggedInUserRole === 'SuperAdmin' && role === 'Admin';

    if (shouldShowApplicationField) {
      fields.push({
        name: 'applicationId',
        label: t('application.singular'),
        placeholder: t('placeholder.selectApplicationPlaceholder'),
        type: 'dropdown',
        options: applicationOptions,
        required: true,
        disabled: mode === 'edit'
      });
    }

    return fields;
  };

  return (
    <KeyboardAwareScrollView
      style={scrollViewStyle}
      contentContainerStyle={scrollContentStyle}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <DynamicForm
        fields={getUserFields()}
        initialValues={{
          firstName: userToEdit?.firstName || '',
          lastName: userToEdit?.lastName || '',
          email: userToEdit?.email || '',
          password: mode === 'edit' ? '******' : '',
          applicationId: userToEdit?.applicationId || '',
          phoneNumber: userToEdit?.phoneNumber || ''
        }}
        mode={mode}
        onSubmit={(data: UserFormValues) =>
          onCreate({
            ...data,
            role: role ? role : 'User'
          })
        }
        onCancel={() => {
          setUserToEdit(null);
          setShowAddUserView(false);
        }}
      />
    </KeyboardAwareScrollView>
  );
}
