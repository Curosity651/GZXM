import { Card, Col, Row, Table, Tag } from 'antd';
import { PageHeader } from '../../components/common/PageHeader';
import { useAppStore } from '../../store';

export function ArchiveCatalogPage() {
  const state = useAppStore();
  const groups = [
    { key: 'PROJECT_PUBLIC', title: '重点项目公共材料', source: '国家归档清单 · 项目责任列', color: 'blue' },
    { key: 'TOPIC_NATIONAL', title: '课题国家材料', source: '国家归档清单 · 课题责任列', color: 'cyan' },
    { key: 'SELF_FUNDED', title: '配套自筹项目材料', source: '企业自筹清单 · 科技/技改/基建', color: 'purple' },
  ];
  return <>
    <PageHeader title="归档目录与清单来源" description="本期清单以 Excel 材料为 Mock 模板，保留责任层级、必存属性、来源编号和模板版本。" />
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>{groups.map((group) => <Col xs={24} md={8} key={group.key}><Card><Tag color={group.color}>{group.title}</Tag><h3>{state.archiveRequirements.filter((item) => item.ownerType === group.key).length} 个清单项</h3><span>{group.source}</span></Card></Col>)}</Row>
    <Card><Table rowKey="id" dataSource={state.archiveRequirements} columns={[
      { title: '责任层级', dataIndex: 'ownerType', width: 170, render: (value) => <Tag color={value === 'PROJECT_PUBLIC' ? 'blue' : value === 'TOPIC_NATIONAL' ? 'cyan' : 'purple'}>{value === 'PROJECT_PUBLIC' ? '项目公共' : value === 'TOPIC_NATIONAL' ? '课题国家' : '配套自筹'}</Tag> },
      { title: '材料名称', dataIndex: 'name' }, { title: '要求', dataIndex: 'requirementKind', width: 110, render: (value) => <Tag color={value === 'REQUIRED' ? 'red' : 'gold'}>{value === 'REQUIRED' ? '必存' : '有则必存'}</Tag> },
      { title: '来源编号', dataIndex: 'sourceCode', width: 110, render: (value) => value ?? '企业清单' }, { title: '模板版本', dataIndex: 'templateId', width: 170, render: (value) => value ?? '国家清单当前版' },
    ]} /></Card>
  </>;
}
