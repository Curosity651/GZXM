import { Card, InputNumber, Switch, Table, Tag, Typography } from 'antd';
import { useAppStore } from '../../store';
import { canPerform } from '../../domain/permissions';
import { PageHeader } from '../../components/common/PageHeader';

const { Text } = Typography;

export function WarningRulePage() {
  const state = useAppStore();
  const editable = canPerform(state.currentUser!, state.roles, 'warning.manage');
  return <>
    <PageHeader title="预警规则配置" description="科研助理维护黄、橙、红三级阈值；其他角色仅查看。" />
    <Card><Table rowKey="id" pagination={false} dataSource={state.warningRules} columns={[
      { title: '规则名称', dataIndex: 'name', render: (value) => <Text strong>{value}</Text> },
      { title: '状态', dataIndex: 'enabled', width: 100, render: (value, row) => <Switch checked={value} disabled={!editable} onChange={(checked) => state.updateWarningRule(row.id, { enabled: checked })} /> },
      { title: '黄色阈值', render: (_, row) => <Tag color="gold">提前 {row.levels.find((item) => item.level === 'yellow')?.advanceDays ?? 0} 天</Tag> },
      { title: '橙色阈值', render: (_, row) => <Tag color="orange">提前 {row.levels.find((item) => item.level === 'orange')?.advanceDays ?? 0} 天</Tag> },
      { title: '红色阈值', render: (_, row) => <InputNumber value={row.levels.find((item) => item.level === 'red')?.advanceDays ?? 0} disabled={!editable} addonAfter="天" /> },
    ]} /></Card>
  </>;
}
