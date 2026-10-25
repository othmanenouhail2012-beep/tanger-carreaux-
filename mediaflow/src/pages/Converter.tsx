import { useState } from 'react';
import { useApp } from '../store';
import { PageHeader } from '../components/Layout';
import { UploadDropzone } from '../components/Inputs';
import { MediaPreview, TaskRow } from '../components/Media';

export default function Converter() {
  const { t, current, setCurrent, tasks } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const media = current?.source === 'upload' ? current : null;
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PageHeader title={t.converter.title} subtitle={t.converter.subtitle} />
      <UploadDropzone compact onResult={(m, f) => { setFile(f); setCurrent(m); }} />
      {media && <div className="mt-6"><MediaPreview media={media} file={file} /></div>}
      {tasks.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-semibold">{t.nav.tasks}</h2>
          <ul className="space-y-3">{tasks.slice(0, 3).map((x) => <TaskRow key={x.id} task={x} />)}</ul>
        </div>
      )}
    </div>
  );
}
