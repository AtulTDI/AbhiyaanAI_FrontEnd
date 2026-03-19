import { getActiveApplications } from '../api/applicationApi';
import { FieldConfig, FieldType } from '../types';
import { Application } from '../types/Application';
import { logger } from '../utils/logger';
import DynamicForm from './DynamicForm';
import React, { useEffect, useState } from 'react';

type ApplicationOption = {
  label: string;
  value: string;
};

type Props = {
  onCreate: (data: { channelName: string; applicationId: string }) => void;
  setShowAddChannelView: (visible: boolean) => void;
  formSubmitLoading: boolean;
};

export default function CreateChannelForm({
  onCreate,
  setShowAddChannelView,
  formSubmitLoading
}: Props) {
  const [applicationOptions, setApplicationOptions] = useState<ApplicationOption[]>([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await getActiveApplications(0, 100000);
        const apps = response.data.items || [];
        const appArray = Array.isArray(apps) ? apps : [apps];

        const formatted = appArray.map((app: Application) => ({
          label: app.name,
          value: app.id ?? ''
        }));
        setApplicationOptions(formatted);
      } catch (error) {
        logger.error('Failed to fetch applications', error);
      }
    };

    fetchApplications();
  }, []);

  const getChannelFields = (): FieldConfig[] => [
    {
      name: 'channelName',
      label: 'Channel Name',
      type: 'text',
      required: true
    },
    {
      name: 'applicationId',
      label: 'Application',
      type: 'dropdown' as FieldType,
      options: applicationOptions,
      required: true
    }
  ];

  return (
    <DynamicForm
      fields={getChannelFields()}
      initialValues={{
        channelName: '',
        applicationId: ''
      }}
      mode="create"
      formSubmitLoading={formSubmitLoading}
      onSubmit={(data) =>
        onCreate(
          data as {
            channelName: string;
            applicationId: string;
          }
        )
      }
      onCancel={() => {
        setShowAddChannelView(false);
      }}
    />
  );
}
