import * as React from 'react';
import { Link } from 'react-router-dom';
import makeClassName from 'classnames';
import chunk from 'lodash.chunk';
import debounce from 'lodash.debounce';

import { getCodeLineAnchor, getLines } from '../CodeView/utils';
import {
  LinterMessage as LinterMessageType,
  findMostSevereType,
} from '../../reducers/linter';
import styles from './styles.module.scss';
import { gettext } from '../../utils';
import { Version } from '../../reducers/versions';
import LinterProvider, { LinterProviderInfo } from '../LinterProvider';
import CodeLineShapes from '../CodeLineShapes';
import { LineShapes, generateLineShapes } from '../CodeLineShapes/utils';

const OVERVIEW_PADDING = 10;

export type PublicProps = {
  content: string;
  version: Version;
};

type Props = PublicProps;

type State = {
  // This is the height of the overview div in pixels.
  overviewHeight: number | null;
};

export default class CodeOverview extends React.Component<Props, State> {
  public state = { overviewHeight: null };

  private overviewRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    this.setOverviewHeight();

    // When the user begins resizing, first clear the overview contents.
    window.addEventListener('resize', this.resetOverviewHeight);
    // After a short delay, get the new height and re-render.
    window.addEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetOverviewHeight);
    window.removeEventListener('resize', this.waitAndSetNewOverviewHeight);
  }

  resetOverviewHeight = () => {
    this.setState({ overviewHeight: null });
  };

  setOverviewHeight = () => {
    if (this.overviewRef && this.overviewRef.current) {
      this.setState({ overviewHeight: this.overviewRef.current.clientHeight });
    }
  };

  waitAndSetNewOverviewHeight = debounce(this.setOverviewHeight, 200, {
    leading: false,
    trailing: true,
  });

  renderRow(
    selectedMessageMap: LinterProviderInfo['selectedMessageMap'],
    rowIndex: number,
    groupOflineShapes: LineShapes[] | void,
  ) {
    if (!groupOflineShapes) {
      return null;
    }

    const messages = selectedMessageMap
      ? groupOflineShapes.reduce((matches: LinterMessageType[], shape) => {
          if (selectedMessageMap.byLine[shape.line]) {
            return matches.concat(selectedMessageMap.byLine[shape.line]);
          }

          return matches;
        }, [])
      : [];

    if (messages.length) {
      const type = findMostSevereType(messages);
      return (
        <div
          key={messages.map((m) => m.uid).join(':')}
          className={makeClassName(styles.linterMessage, {
            [styles.linterError]: type === 'error',
            [styles.linterWarning]: type === 'warning',
            [styles.linterNotice]: type === 'notice',
          })}
        />
      );
    }

    // Render the first line in the group.
    const lineShapes = groupOflineShapes[0];

    return <CodeLineShapes lineShapes={lineShapes} />;
  }

  renderOverview(selectedMessageMap: LinterProviderInfo['selectedMessageMap']) {
    const { content } = this.props;

    if (!this.state.overviewHeight) {
      return null;
    }

    // Calculate the height of the overview div.
    const innerOverviewHeight =
      (this.state.overviewHeight || 0) - OVERVIEW_PADDING * 2;

    const linePadding = 2;
    const lineHeight = 10;

    // The first item won't have padding so factor that in.
    const numberOfRows = Math.floor(
      (innerOverviewHeight - linePadding) / lineHeight,
    );

    const allLineShapes = generateLineShapes(getLines(content));

    let chunkSize = 1;
    if (allLineShapes.length > numberOfRows) {
      // Split file lines evenly between all rows.
      chunkSize = Math.ceil(allLineShapes.length / numberOfRows);
    }

    const chunkedLineShapes = chunk(allLineShapes, chunkSize);
    const overview = [];

    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
      const shapes = chunkedLineShapes[rowIndex] || undefined;
      // Use the first line in the group.
      const line = shapes ? shapes[0].line : undefined;

      overview.push(
        <Link
          to={line ? getCodeLineAnchor(line) : '#'}
          key={rowIndex}
          title={line ? gettext(`Jump to line ${line}`) : ''}
        >
          <div
            className={styles.line}
            style={{
              height: `${lineHeight}px`,
              paddingTop: rowIndex > 0 ? `${linePadding}px` : undefined,
            }}
          >
            {this.renderRow(selectedMessageMap, rowIndex, shapes)}
          </div>
        </Link>,
      );
    }

    return overview;
  }

  renderWithLinterInfo = ({ selectedMessageMap }: LinterProviderInfo) => {
    return (
      <div
        ref={this.overviewRef}
        className={styles.CodeOverview}
        style={{
          padding: `${OVERVIEW_PADDING}px`,
        }}
      >
        {this.renderOverview(selectedMessageMap)}
      </div>
    );
  };

  render() {
    const { overviewHeight } = this.state;
    const { version } = this.props;

    return (
      <LinterProvider
        key={overviewHeight ? String(overviewHeight) : ''}
        versionId={version.id}
        validationURL={version.validationURL}
        selectedPath={version.selectedPath}
      >
        {this.renderWithLinterInfo}
      </LinterProvider>
    );
  }
}